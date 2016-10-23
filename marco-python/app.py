from flask import Flask, request, render_template
from geotext import GeoText
import requests
import MySQLdb
from google import search
from bs4 import BeautifulSoup
import urllib2
import random
import twitter
import json
import flickrapi
from configs import *

app = Flask(__name__)


def get_place_and_details_for_user(exclude_city):
    db = MySQLdb.connect(MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DB)
    cursor = db.cursor()

    if exclude_city is None:
        cursor.execute("SELECT place, place_cnt from (SELECT place, count(place) as place_cnt from places group by place order by count(place) desc limit 7) as T1 order by RAND() limit 1")
    else:
        cursor.execute("SELECT place, place_cnt from (SELECT place, count(place) as place_cnt from places where NOT place ='" + exclude_city.lower() + "'group by place order by count(place) desc limit 7) as T1 order by RAND() limit 1")
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
    exclude_city = request.args.get('exclude')
    (place, visits) = get_place_and_details_for_user(exclude_city)
    mmt_url = get_booking_url(place)

    flickrclient = flickrapi.FlickrAPI(FLICKR_KEY, FLICKR_SECRET, format='parsed-json')
    photos = flickrclient.photos.search(tags=[place],sort="interestingness-desc", safe_search=1, content_type=1, tag_mode="all", per_page=15)
    ind = random.randrange(len(photos["photos"]["photo"]))
    img = photos["photos"]["photo"][ind]
    bg_img = "http://farm" + str(img["farm"])+ ".staticflickr.com/"+ str(img["server"])+"/" + str(img["id"]) + "_"+ str(img["secret"]) +"_h.jpg"
    
    return render_template('index.html', place=place, visits=visits, bg_img=bg_img, mmt_url=mmt_url)

@app.route('/')
def index():
    return render_template('intro.html')

@app.route('/trip_api')
def get_trip_api():
    exclude_city = request.args.get('exclude')
    (place, visits) = get_place_and_details_for_user(exclude_city)

    return "You seem to have an attachment for " + place + ". You've come across it about " + str(visits) + " times" 

@app.route('/what_to_do_api')
def get_stuff_to_do():
    city = request.args.get('city')

    urls = search("Tripadvisor " + city, stop=2)
    soup = BeautifulSoup(urllib2.urlopen(urls.next()))

    result = soup.find("div", {"class":"content"})
    return result.text

def get_booking_url(city):
    # Assuming start location as Namma Bengaluru
    urls = search("MakeMyTrip Bangalore to " + city, stop=2)
    return urls.next()

@app.route('/book_tickets')
def book_tickets():
    city = request.args.get('city')

    url = get_booking_url(city)
    soup = BeautifulSoup(urllib2.urlopen(url))

    table = soup.find("table", {"class":"table"})
    tds = table.find_all('td')
    return "Lowest Price in next 7 days is Rupees " + tds[5].renderContents()[4:-1] + " on " + tds[6].renderContents() + ". Booking your travel on that flight. Bon Voyage!"
    return result.text

@app.route('/social_api')
def twitter_api():
    city = request.args.get('city')

    api = twitter.Api(consumer_key=CONSUMER_KEY, consumer_secret=CONSUMER_SECRET, access_token_key=ACCESS_TOKEN_KEY, access_token_secret=ACCESS_TOKEN_SECRET)
    status = api.PostUpdate("I'm planning a trip to " + city + " with #Marco. Want to join me?")
    return "Awesome. I've just informed your friends on twitter about your upcoming trip!"

# Flask 0.10 Compatibility
#if __name__ =='__main__':
#    app.run()
