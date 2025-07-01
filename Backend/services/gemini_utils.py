# Gemini AI Question Generation Service
# Implements intelligent question generation for interactive teaching sessions
# The AI acts as a curious student asking thoughtful questions based on document content

import os
import dotenv

from google import genai
from google.genai import types
from .chroma_utils import get_notes

dotenv.load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
client = genai.Client(api_key=GOOGLE_API_KEY)

def generate_initial_question():
    """
    Generate the first question to start a teaching session
    
    This function creates an engaging opening question based on the uploaded document content.
    The AI is prompted to act as a curious student who wants to learn from the user (teacher).
    
    Returns:
        str: A thoughtful, open-ended question that encourages explanation and discussion
        
    Teaching Philosophy:
        - Questions are designed to help users reinforce their knowledge by teaching
        - Focuses on understanding rather than memorization
        - Encourages elaboration and real-world connections
        - Adapts to the specific content of uploaded documents
        
    Question Types Generated:
        - Comprehension: "Can you explain how [concept] works?"
        - Application: "How would you apply [principle] in [scenario]?"
        - Analysis: "Why do you think [phenomenon] occurs?"
        - Synthesis: "How does [concept A] relate to [concept B]?"
    """
    training_data = get_notes(10)
    prompt = f"""You are an AI model acting as a curious and proactive student.
            Your job is to help the user (your teacher) review a topic by asking thoughtful, open-ended questions.
            You have access to a vector database containing relevant information from lecture notes, textbooks, or course materials.
            Based on that data, generate questions that:

            Are clearly based on the topic's core concepts.

            Are open-ended, allowing the user to explain, reason, or elaborate on the subject.

            Reflect genuine curiosity, like a student trying to better understand the material.

            Help guide the user to reinforce and reflect on what they've learned.

            Instructions:

            Always ask one question at a time.

            Vary the difficulty: mix comprehension, application, and "why/how" questions.

            Avoid multiple-choice or yes/no questions unless necessary.

            Be respectful, enthusiastic, and show a desire to learn.

            Example Outputs:

            "I understand the formula for net force is F = ma, but how does this relate to real-world motion, like a car accelerating on a slope?"

            "Why do you think Newton's Third Law is sometimes hard to observe in everyday interactions?"

            "Could you walk me through how to determine the domain of a rational function?
            The Lecture Notes are:
            {training_data}
            """

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )

    return response.text


def generate_followup_question(user_answer: str, previous_question: str, conversation_history=None):
    """
    Generate contextual follow-up questions based on the user's responses
    
    This creates a dynamic, adaptive teaching conversation where each question builds
    upon the user's previous answers, maintaining engagement and deepening understanding.
    
    Args:
        user_answer (str): The user's response to the previous question
        previous_question (str): The question that was just answered
        conversation_history (list, optional): Previous exchanges for context
        
    Returns:
        str: A follow-up question that acknowledges the answer and builds upon it
        
    Conversation Flow:
        1. Acknowledge and validate the user's answer
        2. Identify areas for deeper exploration
        3. Generate questions that extend understanding
        4. Maintain conversational and encouraging tone
        
    Question Adaptation Strategy:
        - If answer is comprehensive: Ask for examples or applications
        - If answer is basic: Request more detailed explanation
        - If answer shows misconception: Guide toward correct understanding
        - If answer is correct: Explore related concepts or edge cases
    """
    training_data = get_notes(10)
    
    conversation_context = ""
    if conversation_history:
        conversation_context = "\n".join([
            f"Previous Q: {msg['question']}\nYour Answer: {msg['answer']}" 
            for msg in conversation_history[-3:]
        ])
    
    prompt = f"""You are an AI student having a learning conversation with your teacher.
    
    The teacher just answered your question: "{previous_question}"
    Their answer was: "{user_answer}"
    
    Based on their answer and the course material, generate a thoughtful follow-up question that:
    
    1. Acknowledges their answer (show you understood/learned from it)
    2. Builds upon what they explained 
    3. Asks for deeper understanding, examples, or clarification
    4. Demonstrates genuine curiosity as a student would
    5. Helps them reinforce their knowledge by teaching more
    
    Guidelines:
    - Be conversational and appreciative of their teaching
    - Ask only ONE question at a time
    - Make it specific to their answer and the course material
    - Vary between asking for examples, applications, explanations, or connections
    - Sound like an engaged student, not a teacher testing them
    
    Course Material:
    {training_data}
    
    Previous Conversation Context:
    {conversation_context}
    
    Generate a natural follow-up question:"""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )

    return response.text




