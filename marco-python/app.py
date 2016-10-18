from flask import Flask, request
from geotext import GeoText
import requests
from configs import *

app = Flask(__name__)

@app.route('/updateProfile', methods=['GET', 'POST'])
def update_profile():
  if request.method == 'POST':
    url = request.json['url']
    r = requests.get("http://www.readability.com/api/content/v1/parser?url=" + url + "&token=" + READABILITY_TOKEN) 
    places_list = GeoText(r.text)
    places_set = set(places_list.cities)
    return str(places_set)
  else:
    return "This API only works with POST"