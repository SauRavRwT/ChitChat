from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room, leave_room
from transformers import MarianMTModel, MarianTokenizer

app = Flask(__name__)
CORS(app)

# Initialize Flask-SocketIO
socketio = SocketIO(app, cors_allowed_origins="*")

# Load the translation models
def load_model(model_name):
    tokenizer = MarianTokenizer.from_pretrained(model_name)
    model = MarianMTModel.from_pretrained(model_name)
    return model, tokenizer

# Dictionary to store model/tokenizer pairs
translation_models = {
    ('en', 'hi'): load_model('Helsinki-NLP/opus-mt-en-hi'),  # English to Hindi
    ('hi', 'en'): load_model('Helsinki-NLP/opus-mt-hi-en'),  # Hindi to English
    ('es', 'en'): load_model('Helsinki-NLP/opus-mt-es-en'),  # Spanish to English
    ('en', 'es'): load_model('Helsinki-NLP/opus-mt-en-es'),  # English to Spanish
}

# Function to handle the translation process
def translate(text, source_lang, target_lang):
    print(f"Translating from {source_lang} to {target_lang}: {text}")  # Log input text and languages
    if (source_lang, target_lang) in translation_models:
        model, tokenizer = translation_models[(source_lang, target_lang)]
        encoded_text = tokenizer.encode(text, return_tensors="pt", padding=True)
        translated = model.generate(encoded_text, max_length=512)
        translated_text = tokenizer.decode(translated[0], skip_special_tokens=True)
        print(f"Translated text: {translated_text}")  # Log the translated text
        return translated_text
    else:
        print(f"Translation model not available for {source_lang} to {target_lang}")  # Log missing model
        return f"Translation model not available for {source_lang} to {target_lang}"

# Dictionary to map user emails to their socket IDs, names, and languages
users = {}

# Route to handle user connection
@app.route("/api/connect", methods=["POST"])
def connect_user():
    user_data = request.get_json()
    user_name = user_data.get("name", "Anonymous")
    user_email = user_data.get("email")
    user_language = user_data.get("selectedLanguage")

    # Mapping languages to codes
    language_mapping = {
        "English": "en",
        "Hindi": "hi",
        "Spanish": "es"
    }

    # Map the user's selected language to its code
    if user_language in language_mapping:
        user_language = language_mapping[user_language]
    else:
        return jsonify({"status": "error", "message": "Unsupported language"}), 400

    if user_email not in users:
        users[user_email] = {
            "name": user_name,
            "language": user_language,
            "socket_id": None,
        }

    # Notify all users about the update
    socketio.emit("update_users", [{"name": user_info["name"], "email": user_email} for user_email, user_info in users.items()])

    return jsonify({"status": "User connected", "users": [{"name": user_info["name"], "email": user_email} for user_email, user_info in users.items()]})

# WebSocket event to handle joining a room
@socketio.on("join")
def on_join(data):
    user_email = data["email"]
    if user_email in users:
        users[user_email]["socket_id"] = request.sid
        join_room(user_email)
        print(f"{users[user_email]['name']} has joined their room.")
    else:
        print(f"User with email {user_email} not found.")

# WebSocket event to handle sending personal messages
@socketio.on("send_personal_message")
def handle_personal_message(data):
    recipient_email = data["recipient_email"]
    sender_email = data["sender_email"]
    message = data["message"]

    if sender_email in users and recipient_email in users:
        sender_lang = users[sender_email]["language"]
        recipient_lang = users[recipient_email]["language"]

        # Translate from sender's language to recipient's language
        if sender_lang != recipient_lang:
            translated_message = translate(message, sender_lang, recipient_lang)
        else:
            translated_message = message  # No translation needed if both speak the same language

        recipient_socket_id = users[recipient_email].get("socket_id")
        if recipient_socket_id:
            emit("receive_message", {
                "sender": users[sender_email]["name"],
                "recipient": users[recipient_email]["name"],
                "message": translated_message
            }, room=recipient_email)
            print(f"Message sent from {sender_email} to {recipient_email}: {translated_message}")
        else:
            print(f"Recipient {recipient_email} not found or not connected.")
    else:
        print(f"Sender or recipient email not found.")

# WebSocket event for handling private rooms (1-on-1 messaging)
@socketio.on("join_private_room")
def on_join_private_room(data):
    user_email = data["email"]
    recipient_email = data["recipientEmail"]
    room_name = f"{min(user_email, recipient_email)}_{max(user_email, recipient_email)}"

    join_room(room_name)
    print(f"{user_email} joined private room: {room_name}")

@socketio.on("leave_private_room")
def on_leave_private_room(data):
    user_email = data["email"]
    recipient_email = data["recipientEmail"]
    room_name = f"{min(user_email, recipient_email)}_{max(user_email, recipient_email)}"

    leave_room(room_name)
    print(f"{user_email} left private room: {room_name}")

@socketio.on("send_private_message")
def handle_private_message(data):
    sender = data["sender"]
    recipient = data["recipient"]
    content = data["content"]
    timestamp = data["timestamp"]

    room_name = f"{min(sender, recipient)}_{max(sender, recipient)}"

    # Detect and handle the translation between users
    sender_lang = users[sender]["language"]
    recipient_lang = users[recipient]["language"]

    # Translate the message
    if sender_lang != recipient_lang:
        translated_text = translate(content, sender_lang, recipient_lang)
    else:
        translated_text = content  # No translation needed if languages are the same

    print(f"Private message sent in room: {room_name} | From: {sender} | To: {recipient} | Original: {content} | Translated: {translated_text} | Timestamp: {timestamp}")

    # Emit the translated message to the private room
    emit("private_message", {
        "sender": sender,
        "recipient": recipient,
        "original_content": content,
        "translated_content": translated_text,
        "timestamp": timestamp
    }, room=room_name)

# WebSocket event to handle user disconnection
@socketio.on("disconnect")
def on_disconnect():
    for user_email, user_info in list(users.items()):
        if request.sid == user_info.get("socket_id"):
            leave_room(user_email)
            del users[user_email]
            print(f"User {user_info['name']} has disconnected.")
            break

if __name__ == "__main__":
    socketio.run(app, debug=True, host="0.0.0.0", port=8080)