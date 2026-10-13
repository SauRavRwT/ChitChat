from typing import cast

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room, leave_room
import torch
from transformers import MarianMTModel, MarianTokenizer

app = Flask(__name__)
CORS(app)

# Initialize Flask-SocketIO
socketio = SocketIO(app, cors_allowed_origins="*")


# Load the translation models
def load_model(model_name: str) -> tuple[MarianMTModel, MarianTokenizer]:
    tokenizer = cast(
        MarianTokenizer,
        MarianTokenizer.from_pretrained(model_name, output_loading_info=False),
    )
    model = cast(
        MarianMTModel,
        MarianMTModel.from_pretrained(model_name, output_loading_info=False),
    )
    model.eval()
    return model, tokenizer


# Dictionary to store model/tokenizer pairs
translation_models: dict[
    tuple[str, str], tuple[MarianMTModel, MarianTokenizer]
] = {
    ("en", "hi"): load_model("Helsinki-NLP/opus-mt-en-hi"),  # English to Hindi
    ("hi", "en"): load_model("Helsinki-NLP/opus-mt-hi-en"),  # Hindi to English
    ("es", "en"): load_model("Helsinki-NLP/opus-mt-es-en"),  # Spanish to English
    ("en", "es"): load_model("Helsinki-NLP/opus-mt-en-es"),  # English to Spanish
}


# Function to handle the translation process
def translate(text, source_lang, target_lang):
    model_and_tokenizer = translation_models.get((source_lang, target_lang))
    if model_and_tokenizer is None:
        raise ValueError(
            f"Translation model not available for {source_lang} to {target_lang}"
        )

    model, tokenizer = model_and_tokenizer
    encoded_text = tokenizer.encode(
        text,
        return_tensors="pt",
        truncation=True,
        max_length=512,
    )
    with torch.inference_mode():
        translated = model.generate(
            input_ids=encoded_text, max_length=512, num_beams=1
        )
    return tokenizer.decode(translated[0], skip_special_tokens=True)


# Active users are keyed by normalized email; each can have multiple active sockets.
users = {}
socket_users = {}


def normalize_email(email):
    return email.strip().lower() if isinstance(email, str) else ""


def get_online_users():
    return [
        {"name": user["name"], "email": email}
        for email, user in users.items()
        if user["socket_ids"]
    ]


def private_room_name(first_email, second_email):
    return "_".join(
        sorted((normalize_email(first_email), normalize_email(second_email)))
    )


# Route to handle user connection
@app.route("/api/connect", methods=["POST"])
def connect_user():
    user_data = request.get_json(silent=True)
    if not isinstance(user_data, dict):
        return jsonify({"status": "error", "message": "Invalid user data"}), 400

    user_name = user_data.get("name", "Anonymous")
    user_email = normalize_email(user_data.get("email"))
    user_language = user_data.get("selectedLanguage")
    if not user_email:
        return jsonify({"status": "error", "message": "Email is required"}), 400

    # Mapping languages to codes
    language_mapping = {"English": "en", "Hindi": "hi", "Spanish": "es"}

    # Map the user's selected language to its code
    if user_language in language_mapping:
        user_language = language_mapping[user_language]
    else:
        return jsonify({"status": "error", "message": "Unsupported language"}), 400

    user = users.setdefault(user_email, {"socket_ids": set()})
    user.update({"name": user_name, "language": user_language})

    online_users = get_online_users()
    socketio.emit("update_users", online_users)

    return jsonify({"status": "User connected", "users": online_users})


# WebSocket event to handle joining a room
@socketio.on("join")
def on_join(data):
    user_email = normalize_email(data.get("email") if isinstance(data, dict) else None)
    if user_email in users:
        socket_id = getattr(request, "sid", None)
        previous_email = socket_users.get(socket_id)
        if previous_email and previous_email != user_email:
            users[previous_email]["socket_ids"].discard(socket_id)

        users[user_email]["socket_ids"].add(socket_id)
        socket_users[socket_id] = user_email
        join_room(user_email)
        socketio.emit("update_users", get_online_users())
    else:
        print("A socket tried to join before its user was registered.")


# WebSocket event to handle sending personal messages
@socketio.on("send_personal_message")
def handle_personal_message(data):
    recipient_email = normalize_email(data["recipient_email"])
    sender_email = normalize_email(data["sender_email"])
    message = data["message"]

    if sender_email in users and recipient_email in users:
        sender_lang = users[sender_email]["language"]
        recipient_lang = users[recipient_email]["language"]

        # Translate from sender's language to recipient's language
        if sender_lang != recipient_lang:
            translated_message = translate(message, sender_lang, recipient_lang)
        else:
            translated_message = (
                message  # No translation needed if both speak the same language
            )

        if users[recipient_email]["socket_ids"]:
            emit(
                "receive_message",
                {
                    "sender": users[sender_email]["name"],
                    "recipient": users[recipient_email]["name"],
                    "message": translated_message,
                },
                to=recipient_email,
            )
            app.logger.debug("Message sent from %s to %s", sender_email, recipient_email)
        else:
            print(f"Recipient {recipient_email} not found or not connected.")
    else:
        print(f"Sender or recipient email not found.")


# WebSocket event for handling private rooms (1-on-1 messaging)
@socketio.on("join_private_room")
def on_join_private_room(data):
    user_email = normalize_email(data["email"])
    recipient_email = normalize_email(data["recipientEmail"])
    if not user_email or user_email == recipient_email:
        return

    room_name = private_room_name(user_email, recipient_email)

    join_room(room_name)
    print(f"{user_email} joined private room: {room_name}")


@socketio.on("leave_private_room")
def on_leave_private_room(data):
    user_email = normalize_email(data["email"])
    recipient_email = normalize_email(data["recipientEmail"])
    room_name = private_room_name(user_email, recipient_email)

    leave_room(room_name)
    print(f"{user_email} left private room: {room_name}")


@socketio.on("send_private_message")
def handle_private_message(data):
    sender = normalize_email(data["sender"])
    recipient = normalize_email(data["recipient"])
    if not sender or sender == recipient:
        print("Rejected private message to the sender.")
        return

    if sender not in users or recipient not in users:
        print("Sender or recipient email not found.")
        return

    content = data["content"]
    timestamp = data["timestamp"]

    room_name = private_room_name(sender, recipient)

    # Detect and handle the translation between users
    sender_lang = users[sender]["language"]
    recipient_lang = users[recipient]["language"]

    # Translate the message
    if sender_lang != recipient_lang:
        translated_text = translate(content, sender_lang, recipient_lang)
    else:
        translated_text = content  # No translation needed if languages are the same

    app.logger.debug("Private message sent in room %s", room_name)

    # Emit the translated message to the private room
    emit(
        "private_message",
        {
            "sender": sender,
            "recipient": recipient,
            "original_content": content,
            "translated_content": translated_text,
            "timestamp": timestamp,
        },
        to=room_name,
    )


# WebSocket event to handle user disconnection
@socketio.on("disconnect")
def on_disconnect():
    socket_id = getattr(request, "sid", None)
    if socket_id is None:
        return

    user_email = socket_users.pop(socket_id, None)
    if user_email is None or user_email not in users:
        return

    users[user_email]["socket_ids"].discard(socket_id)
    if not users[user_email]["socket_ids"]:
        del users[user_email]

    socketio.emit("update_users", get_online_users())


if __name__ == "__main__":
    socketio.run(app, debug=True, host="0.0.0.0", port=8080)
