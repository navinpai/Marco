from flask import Flask, request, render_template
from geotext import GeoText
import requests
import MySQLdb
import random
import geograpy
import json
import flickrapi
from configs import *

app = Flask(__name__)


def get_place_and_details_for_user():
    db = MySQLdb.connect(MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DB)
    cursor = db.cursor()
    cursor.execute("SELECT place, place_cnt from (SELECT place, count(place) as place_cnt from places group by place order by count(place) desc limit 7) as T1 order by RAND() limit 1")
    data = cursor.fetchone()
    return (data[0].title(), data[1])

@app.route('/updateProfile', methods=['GET', 'POST'])
def update_profile():
  if request.method == 'POST':
    url = request.json['url']
    r = requests.get("http://www.readability.com/api/content/v1/parser?url=" + url + "&token=" + READABILITY_TOKEN) 
    r_json = json.loads(r.text)
    places_list = GeoText(r_json["content"])
    places_set = set(places_list.cities)
    insert_list = [(str(place).lower(),) for place in places_set]
    
    try:
        db = MySQLdb.connect(MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DB)
        cursor = db.cursor()
        cursor.executemany("INSERT into places VALUES (%s)", insert_list)
        db.commit()
    except MySQLdb.Error as e:
        return "Error Occured"
    finally:
        cursor.close()
        db.close()
    return str(places_set)
  else:
    return "This API only works with POST"

@app.route('/trip')
def get_trip():
    (place, visits) = get_place_and_details_for_user()

    flickrclient = flickrapi.FlickrAPI(FLICKR_KEY, FLICKR_SECRET, format='parsed-json')
    photos = flickrclient.photos.search(tags=[place],sort="interestingness-desc", safe_search=1, content_type=1, tag_mode="all", per_page=15)
    ind = random.randrange(len(photos["photos"]["photo"]))
    img = photos["photos"]["photo"][ind]
    bg_img = "http://farm" + str(img["farm"])+ ".staticflickr.com/"+ str(img["server"])+"/" + str(img["id"]) + "_"+ str(img["secret"]) +"_h.jpg"
    
    return render_template('index.html', place=place, visits=visits, bg_img=bg_img)

