from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

responses = {
    "hey": "Rawrrr! How can I help you today?",
    "hi": "Rawrrr! How can I help you today?",
    "hello": "Rawrrr! How can I help you today?",
    "bye": "Arigato! Have a great day!",
    "how are you": "You Brat I'm Kurama😂!! How about you?",
    "what's your name": "I'm Kurama, your friendly AI assistant!",
    "thank you": "Rawrrr! Let me know if you need more help.",
    "who created you": "I was created by Nivas",
    "what can you do": "I can chat with you and answer your questions. Try me!",
    "good morning": "Good morning! How’s your day going?",
    "good night": "Good night! Sweet dreams!",
    "i love you": "Aw, that's sweet! I love chatting with you too!"

}

python_responses = {
    "what is a variable": "A variable stores data. Example:\n```python\nx = 5\ny = 'Hello'\nprint(x, y)\n```",
    "what is function": "A function is a reusable block of code. Example:\n```python\ndef greet():\n    print('Hello')\ngreet()\n```",
    "what is loop": "A loop repeats a block of code. Example:\n```python\nfor i in range(5):\n    print(i)\n```",
    "what is if statement": "An if statement runs code based on a condition. Example:\n```python\nx = 10\nif x > 5:\n    print('x is greater than 5')\n```",
    "what is list": "A list holds multiple values. Example:\n```python\nmy_list = [1, 2, 3]\nprint(my_list)\n```",
    "what is dictionary": "A dictionary stores key-value pairs. Example:\n```python\nmy_dict = {'name': 'John', 'age': 30}\nprint(my_dict['name'])\n```",
    "what is class": "A class defines an object blueprint. Example:\n```python\nclass Person:\n    def __init__(self, name):\n        self.name = name\n\np = Person('John')\nprint(p.name)\n```",
    "what is inheritance": "Inheritance allows a class to use another class's methods. Example:\n```python\nclass Animal:\n    def speak(self):\n        print('Animal speaks')\n\nclass Dog(Animal):\n    pass\n\nmy_dog = Dog()\nmy_dog.speak()\n```",
    "what is import": "You can import modules to use extra functions. Example:\n```python\nimport math\nprint(math.sqrt(16))\n```"
}

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/chatbot')
def chatbot():
    return render_template('chatbot.html')

@app.route('/chat', methods=['POST'])
def chat():
    user_input = request.form.get('user_input').lower().strip()

    if not user_input:
        return jsonify({"response": "I didn't catch that. Can you repeat?"})

    for key in responses:
        if key in user_input:
            response = responses[key]["text"]
            gif = responses[key]["gif"]
            if gif:
                response += f' <img src="{gif}" alt="gif" style="height: 30px; margin-left: 5px;">'
            return jsonify({"response": response})

    for key in python_responses:
        if key in user_input:
            return jsonify({"response": python_responses[key]})

    return jsonify({"response": "I'm not sure how to respond to that. Can you clarify?"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True)
