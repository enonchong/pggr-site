var express = require('express');
var app = express();
var fs = require("fs");
var request = require('request');
var Crypto = require('crypto');
var bodyParser = require('body-parser')

var nodemailer = require('nodemailer');
var sgTransport = require('nodemailer-sendgrid-transport');
var mailer = nodemailer.createTransport(sgTransport({
    auth: {
        api_key: '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'
    }
}));

function email(to, text, callback) {
    var email = {
        to: [to],
        from: 'noreply@pggr.org',
        subject: 'Hi there',
        text: text
    };

    mailer.sendMail(email, function(err, res) {
        if (err) {
            callback(false)
        }
        callback(true);
    });
}

function contact(to, from, subject, text, callback) {
    var email = {
        to: to,
        from: from,
        subject: subject,
        text: text + "\n---------------\nDelivered from PGGR.org by SendGrid"
    };

    mailer.sendMail(email, function(err, res) {
        if (err) {
            callback(false)
        }
        callback(true);
    });
}


// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
    extended: false
}))

// parse application/json
app.use(bodyParser.json())
var compiled = "";

function randomStr() {
    return Crypto.randomBytes(8).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/\=/g, '');
}
//Send web request
function curl(url, callback) {
    request(url, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            callback(body)
        } else {
            callback(false);
        }
    })
}

//SQLite Data Management
var sqlite3 = require("sqlite3").verbose();
var db = new sqlite3.Database("pggr-db/data.db");

//Simplified Querying
function sql(query, callback = function() {}) {
    db.all(query, function(err, rows) {
        if (err) {
            callback(false);
            return 1;
        }
        console.log("SQL Query ran")
        console.log(rows.length, "rows");
        callback(rows);
    });
}


function postal2coord(postal, callback) {
    curl("http://maps.googleapis.com/maps/api/geocode/json?address=" + encodeURI(postal) + "&sensor=true", function(data) {
        if (JSON.parse(data).results.length !== 0) {
            var location = JSON.parse(data).results[0].geometry.location;
            callback(location.lat, location.lng);
        } else {
            //Invalid Point
            callback(false, false);
        }

    });
}


function adduser(postal, contact, callback) {
    postal2coord(postal, function(lat, lng) {
        if (lat && lng) {
            sql("INSERT INTO liste_codepostaux (nb_personnes, courriel, lat, lng) VALUES (1, '" + sqlesc(contact) + "', '" + lat + "', '" + lng + "')", function(success) {
                if (success) {
                    callback(true);
                } else {
                    callback(false);
                }
            })
        } else {
            callback(false);
        }

    });

    //Update compiled data
    summary();
}



function summary(callback = function(data) {
    compiled = data
}) {
    sql("Select * from liste_codepostaux", function(rows) {
        //Summary of entire database

        //Process matches via associative array
        var results1 = {}

        rows.forEach(function(value, index, array) {
            var index = value.lat + " " + value.lng;
            if (results1[index]) {
                results1[index] += value.nb_personnes;
            } else {
                results1[index] = value.nb_personnes;
            }
        });

        //Sort matches in indexed array
        var results2 = [];
        for (var index in results1) {
            var coord = index.split(" ");
            var lat = coord[0];
            var lng = coord[1];

            results2.push({
                "lat": lat,
                "lng": lng,
                "nb_personnes": results1[index]
            });
        }
        callback(results2);
    });
}
summary();

//Dealing with cookies
app.use(require("cookie-parser")())

/*
  openPage() returns the HTML of a requested page. If the page does not exist, it returns the HTML of the 404 error page.
*/
function openPage(lang, page, callback) {
    //Read relevant html file
    fs.readFile("html/" + lang + "/" + page + ".html", function(err, data) {
        if (err) {
            //file does not exist
            fs.readFile("html/" + lang + "/" + "404.html", {encoding: 'utf-8'}, function(err, errorPage) {
                //send 404 html
                callback(errorPage);
            })
        } else {
            //send page html
            callback(data);
        }
    });
}

//Handle legacy links from old website
app.get('/:legacy', function(req, res, next) {
    var legacy = req.params.legacy;
    var lang = req.cookies.lang || "fr";
    switch (legacy) {
        case "home":
            res.statusCode = 302;
            res.setHeader('Location', '/' + lang + '/home.html');
            res.end();
            break;
        case "about":
            res.statusCode = 302;
            res.setHeader('Location', '/' + lang + '/home.html');
            res.end();
            break;
        case "history":
            res.statusCode = 302;
            res.setHeader('Location', '/' + lang + '/home.html');
            res.end();
            break;
        case "gallery":
            res.statusCode = 302;
            res.setHeader('Location', '/' + lang + '/home.html');
            res.end();
            break;
        case "contact":
            res.statusCode = 302;
            res.setHeader('Location', '/' + lang + '/home.html');
            res.end();
            break;
        default:
            next();
    }

});

app.get('/', function(req, res, next) {
    var lang = req.cookies.lang || "fr";
    res.statusCode = 302;
    res.setHeader('Location', '/' + lang + '/home');
    res.end();
});

//Language switch
app.get('/:lang', function(req, res, next) {
    var lang = req.params.lang.toLowerCase();
    if (lang == "en" || lang == "fr") {
        res.cookie("lang", lang);
        console.log("Redirecting")
        res.statusCode = 302;
        res.setHeader('Location', '/' + lang + '/home');
        res.end();
    } else {
        next()
    }
});


app.get('/:lang/:page', function(req, res, next) {
    var lang = req.params.lang.toLowerCase();
    var page = req.params.page.toLowerCase();
    if (lang == "en" || lang == "fr") {
        res.setHeader('Content-Type', 'text/html; charset=UTF-8');
        openPage(lang, page, function(data) {
            res.send(data);
        });
    } else {
        next();
    }
});

app.get('/dynamic/compiled.js', function(req, res) {
    res.send("var summary=" + JSON.stringify(compiled));
});

var pending = {};
app.post('/dynamic/subscribe', function(req, res) {
    var token = randomStr();
    pending[token] = {
        postal: req.body.postal,
        contact: req.body.contact
    };
    email(req.body.contact, "You signed up, click here: http://localhost:3000/dynamic/confirm/" + token, function(success) {
        if (success) {
            res.send("Check email for confirmation link");
        } else {
            res.send("Something went wrong");
        }
    });

});


app.post('/dynamic/contact', function(req, res) {
    contact(["", ""], req.body.from, req.body.subject , req.body.text ,function(success) {
        if (success) {
            res.send("Sent");
        } else {
            res.send("Something went wrong");
        }
    });

});

app.get('/dynamic/confirm/:subcode', function(req, res) {
    var data = pending[req.params.subcode];
    if (!data) {
        //Sub link does not exist
        res.send("Code does not exist in live memory");
    } else {
        adduser(data.postal, data.contact, function(success) {
            if (!success) {
                res.send("Database refused entry. Already signed up?");
            } else {
                res.send("Entry added to database");
            }
        });
    }


});

//Static files (css, js, images, etc)
app.use("/static", express.static(__dirname + '/static'));

app.listen(process.env.PORT || 3000, function() {
    console.log('App ready!');
});

//Last handler, probably only 404s
app.use(function(req, res, next) {
    res.status(404);
    res.setHeader('Content-Type', 'text/html; charset=UTF-8');
    var lang = req.cookies.lang || "fr";
    openPage(lang, "404", function(data) {
        res.send(data);
    });

});

function sqlesc(a) {
    return a.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function(a) {
        switch (a) {
            case "\0":
                return "\\0";
            case "\b":
                return "\\b";
            case "\t":
                return "\\t";
            case "":
                return "\\z";
            case "\n":
                return "\\n";
            case "\r":
                return "\\r";
            case '"':
            case "'":
            case "\\":
            case "%":
                return "\\" + a
        }
    })
}