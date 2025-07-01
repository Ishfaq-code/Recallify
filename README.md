# Recallify 
Recallify is an AI driven webapp powered by Gemini to help students study using active recall 

## Frontend
After cloning the repo, navigate into the frontend directory using ```cd Frontend\frontend``` and simply run ```npm install``` to install all the frontend directories. To start the frontend server make sure you are in the correct directory and run ```npm run dev```

## Backend
### Prerequistes
Python 3.8 or Higher Installed on your machine

Naviagate into the backend folder using ```cd Backend``` and create a ```.env``` file. Here you will need a Google [Gemini API Key]((https://aistudio.google.com/prompts/new_chat)) . Store the API Key as ```GOOGLE_API_KEY=YOUR_API_KEY```. Then in your terminal install the necessary backend dependencies by running ```pip install -r requirements.txt```.  

To start the backend server:

On Windows: ```python run.py``` or ```py run.py```
On Mac or Linux: ```python3 run.py``` 

