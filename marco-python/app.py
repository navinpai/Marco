from flask import Flask
from configs import *

app = Flask(__name__)

@app.route('/')
def hello_world():
  return READABILITY_TOKEN