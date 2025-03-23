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
    "how to create a list": "A list holds multiple values. Example:\n```python\nmy_list = [1, 2, 3]\nprint(my_list)\n```",
    "what is a dictionary": "A dictionary stores key-value pairs. Example:\n```python\nmy_dict = {'name': 'John', 'age': 30}\nprint(my_dict['name'])\n```",
    "explain class": "A class defines an object blueprint. Example:\n```python\nclass Person:\n    def __init__(self, name):\n        self.name = name\np = Person('John')\nprint(p.name)\n```",
    "how does inheritance work": "Inheritance allows a class to use another class's methods. Example:\n```python\nclass Animal:\n    def speak(self):\n        print('Animal speaks')\nclass Dog(Animal):\n    pass\nmy_dog = Dog()\nmy_dog.speak()\n```",
    "what is try except": "Use try-except to handle errors. Example:\n```python\ntry:\n    x = 1 / 0\nexcept ZeroDivisionError:\n    print('Cannot divide by zero')\n```",
    "how to use lambda": "Lambda functions are anonymous functions. Example:\n```python\nsquare = lambda x: x * x\nprint(square(5))\n```",
    "how to open a file": "Use `open()` to open files. Example:\n```python\nwith open('file.txt', 'r') as file:\n    content = file.read()\nprint(content)\n```",
    "what is a tuple": "A tuple is an immutable list. Example:\n```python\ntuple_example = (1, 2, 3)\nprint(tuple_example)\n```",
    "how to use list comprehension": "List comprehension creates a list in one line. Example:\n```python\nsquares = [x**2 for x in range(10)]\nprint(squares)\n```",
    "explain recursion": "Recursion is a function that calls itself. Example:\n```python\ndef factorial(n):\n    if n == 0:\n        return 1\n    return n * factorial(n-1)\nprint(factorial(5))\n```",
    "how to use map": "Map applies a function to all items in a list. Example:\n```python\nnums = [1, 2, 3]\nsquared = list(map(lambda x: x**2, nums))\nprint(squared)\n```",
    "what is pip": "Pip is a package manager for Python libraries. Example:\n```bash\npip install requests\n```",
    "what is a module": "A module is a file containing Python definitions and functions. Example:\n```python\nimport math\nprint(math.sqrt(16))\n```",
    "how to use async": "Async allows non-blocking code execution. Example:\n```python\nimport asyncio\nasync def main():\n    print('Hello')\n    await asyncio.sleep(1)\n    print('World')\nasyncio.run(main())\n```",
    "what is a generator": "A generator yields values one at a time. Example:\n```python\ndef my_generator():\n    yield 1\n    yield 2\n    yield 3\nfor value in my_generator():\n    print(value)\n```"
}

career_responses = [
    "The tech field is huge! You can try web development, data science, or cybersecurity. Let me know if you’d like a roadmap!",
    "AI is booming right now! Have you considered machine learning or natural language processing?",
    "Frontend or backend development? Both are in demand! I can help you pick one if you’re unsure.",
    "If you like problem-solving, you could explore competitive programming or software engineering!",
    "Cybersecurity is hot! Protecting data is more important than ever. Interested in learning more?",
    "UI/UX design combines creativity and tech skills. Want to explore it?",
    "Cloud computing is in high demand. Have you looked into AWS, Azure, or Google Cloud?",
    "If you enjoy working with data, data engineering and data analysis could be your thing!",
    "DevOps helps automate software delivery. Want to learn more about it?",
    "Game development is creative and technical. Have you thought about Unity or Unreal Engine?",
    "Product management is a great mix of business and tech. Want to hear more?"
]

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

    if "career" in user_input:
        return jsonify({"response": random.choice(career_responses)})

    return jsonify({"response": "I'm not sure how to respond to that. Can you clarify?"})

@app.route('/kurama')
def kurama():
    return render_template('chatbot.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True)


