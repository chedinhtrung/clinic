from openai import OpenAI
import json
from datetime import datetime
from chatbot.system import *
from config import *

class ChatBot: 
    def __init__(self, openai_key):
        self.client=OpenAI(api_key=openai_key)
        self.system_prompt = SYSPROMPT
        self.num_messages = 1
        
        self.messages =  [{"role": "system", "content": self.system_prompt, }]
        self.max_retries = 5
        self.attempts = 0
        
        self.now = datetime.now().isoformat()
        self.messages[0]["content"] += f" \n The time right now is {self.now}"

    def chat(self, message):
        self.num_messages += 1
        self.messages.append(
            {"role": "user", "content": message, }
        )
        response = self.client.responses.create(
            model=MODEL, 
            input=self.messages,
        )
        
        self.num_messages += 1
        message =  {"role": "assistant", "content": response.output_text, }
        self.messages.append(
            message
        )
        return message
        

                

