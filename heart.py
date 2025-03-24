from flask import Flask, render_template, request, jsonify
import random
import time

app = Flask(__name__)

responses = {
    "hello": ["Rawrrr! How can I help you today?", "Hey! What’s up?", "Yo! How’s it going?"],
    "hi": ["Hey there! What’s on your mind?", "Hi! How can I assist you today?"],
    "bye": ["Arigato! Take care, see you soon!", "Bye! Have an awesome day!"],
    "thank you": ["You’re welcome! Happy to help!", "No problem! Let me know if you need more help."],
    "i love you": ["Aw, that's sweet! I love chatting with you too!", "Rawrrr! You're the best!"],
    "how are you": ["You Brat! I'm Kurama😂!! How about you?", "Feeling powerful! What about you?"],
    "what's your name": ["I'm Kurama, your favorite fox spirit!", "I'm Kurama, your personal AI guide!"],
    "good morning": ["Good morning! How’s your day starting off?", "Morning! Let's make today awesome!"],
    "good night": ["Good night! Sweet dreams!", "Good night! Rest well and come back soon!"],
    "tell me a joke": ["Why don't skeletons fight each other? They don’t have the guts! 😂", "Why did the coffee file a police report? It got mugged! 😂"]
}

python_responses = {
    "what is a variable": "A variable stores data. Example:\n```python\nx = 5\ny = 'Hello'\nprint(x, y)\n```",
    "explain functions": "A function is a reusable block of code. Example:\n```python\ndef greet():\n    print('Hello')\ngreet()\n```",
    "how to use a loop": "A loop repeats a block of code. Example:\n```python\nfor i in range(5):\n    print(i)\n```",
    "what is an if statement": "An if statement runs code based on a condition. Example:\n```python\nx = 10\nif x > 5:\n    print('x is greater than 5')\n```",
    "how to create a list": "A list holds multiple values. Example:\n```python\nmy_list = [1, 2, 3]\nprint(my_list)\n```"
}

career_roadmaps = {
    "ai": "To get into AI, you should: \n1. Learn Python and Math.\n2. Study Machine Learning.\n3. Get familiar with TensorFlow and PyTorch.\n4. Build AI projects.\n5. Apply for AI roles.",
    "web development": "If you’re thinking about web development, start here: \n1. Learn HTML, CSS, and JavaScript.\n2. Pick a frontend framework like React or Vue.\n3. Learn backend with Node.js or Django.\n4. Build full-stack projects.\n5. Apply for web developer roles.",
    "data science": "For data science, follow this roadmap: \n1. Learn Python and SQL.\n2. Study statistics and data visualization.\n3. Learn machine learning.\n4. Work on real datasets.\n5. Apply for data science roles.",
    "cybersecurity": "Want to protect the internet? Here’s the plan: \n1. Learn Networking and Security Fundamentals.\n2. Study Encryption and Threat Analysis.\n3. Get familiar with Security Tools.\n4. Practice with Capture The Flag (CTF) challenges.\n5. Apply for cybersecurity roles.",
    "game development": "Game development is exciting! Try this: \n1. Learn C# or C++.\n2. Get familiar with Unity or Unreal Engine.\n3. Create simple games.\n4. Study game physics and AI.\n5. Build a portfolio and apply for game dev roles.",
    "cloud computing": "For cloud computing, follow this: \n1. Learn AWS, Azure, or Google Cloud.\n2. Study containerization (Docker, Kubernetes).\n3. Understand Infrastructure as Code (Terraform).\n4. Build cloud-based projects.\n5. Get certified and apply for cloud roles.",
    "product management": "Product management blends business and tech skills: \n1. Learn about product lifecycle and market research.\n2. Understand user experience and design thinking.\n3. Study Agile and Scrum methodologies.\n4. Work on product strategy.\n5. Apply for product manager roles.",
    "ui/ux design": "UI/UX design is creative and strategic: \n1. Learn design tools like Figma and Sketch.\n2. Understand user behavior and interaction.\n3. Build wireframes and prototypes.\n4. Get feedback and refine your designs.\n5. Build a portfolio and apply for UI/UX roles."
}

@app.route('/career_roadmap', methods=['POST'])
def career_roadmap():
    career_path = request.form.get('career_path').lower().strip()

    if career_path in career_roadmaps:
        roadmap = career_roadmaps[career_path]
    else:
        roadmap = "I’m not sure about that path yet. Try asking about AI, Web Development, Data Science, or Cybersecurity!"

    return jsonify({"roadmap": roadmap})

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/chat', methods=['POST'])
def chat():
    user_input = request.form.get('user_input').lower().strip()

    if not user_input:
        return jsonify({"response": "I didn't catch that. Can you repeat?"})

    time.sleep(1)

    for key, replies in responses.items():
        if key in user_input:
            return jsonify({"response": random.choice(replies)})

    for key, reply in python_responses.items():
        if key in user_input:
            return jsonify({"response": reply})

    for career in career_roadmaps:
        if career in user_input:
            return jsonify({"response": career_roadmaps[career]})

    if "career" in user_input:
        return jsonify({"response": "Curious about career options? You can ask about AI, Web Development, Data Science, Cybersecurity, Game Development, Cloud Computing, Product Management, or UI/UX Design!"})

    return jsonify({"response": "I'm not sure how to respond to that. Can you clarify?"})

@app.route('/kurama')
def kurama():
    return render_template('chatbot.html')

@app.route('/LLM')
def LLM():
    return render_template('LLM.html')


if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True)
