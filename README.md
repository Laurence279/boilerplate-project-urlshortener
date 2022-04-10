
# URL Shortener Microservice

Returns a JSON with a shortened URL.

## Usage:

POST:
```/api/shorturl //Accepts a 'url' argument in the body. Maps the URL to a UUID. Expires after 7 days```

GET:
```/api/shorturl/<shortened_url> //Redirects to mapped URL```
