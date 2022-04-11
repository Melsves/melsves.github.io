---
---

{% include createjs-2013.12.12.min.js %}
{% include jquery.min.js %}
{% include bootstrap.min.js %}

{% include preloadjs-NEXT.min.js %}
{% include ndgmr.Collision.js %}
{% include game.js %}

var apiUrl = 'flappy-backend.fly.dev';//'localhost:3001'//
var rootUrl = 'flappybird.io';//'localhost:4000'//

function retreiveScore() {
    var hash = location.hash.substring(1);
    $.get( "https://" + apiUrl + "/scores/" + hash, {}, function(data) {
        $('.score').html(data.count);
    }, "json");
}

function submitScore(token) {
    ga('send', 'event', "Flappy Bird", "Score Time", counter.text + " - " + rd, rd);
    $.post( "https://" + apiUrl + "/scores/" + token + "?count=" + counter.text, { }, function(data) {
        window.location = "http://" + window.location.host + "/leaderboard/new/#" + token;
    }, "json");
}

function updateScore(name) {
    var hash = location.hash.substring(1);
    $.ajax( {
        type: "post",
        url: "https://" + apiUrl + "/scores/" + hash + "?name="+name,
        success: function(data) {
            console.log(data)
            if (data.msg === "ok") {
                $('.error').hide();
                window.location = "http://" + window.location.host + "/leaderboard/";
            } else {
                $('.error').show().text(data.msg);
                ga('send', 'event', "Flappy Bird", "Name", name);
            }
        },
        error: function(data) {
            $('.error').show().text(data.responseJSON.msg);
        },
    });
}

function getNewScore(cb) {
    $.post("https://" + apiUrl + "/scores", {}, function(data) {
        cb(data.token)
    })
}

function listScores() {
    $.get( "https://" + apiUrl + "/scores", {}, function(data) {
        $('.loading').remove();
        for (var i=0;i<data.day.length;i++)
        {
            var element = $('<tr><td>' +
                '</td><td>' +
                data.day[i].count +
                '</td></tr>');
            element.children('td').eq(0).text(data.day[i].name);
            $('.day').append(element);
        }
        for (var n=0 ;n<data.hour.length;n++)
        {
            var element2 = $('<tr><td>' +
                '</td><td>' +
                data.hour[n].count +
                '</td></tr>');
            element2.children('td').eq(0).text(data.hour[n].name);
            $('.hour').append(element2);
        }
    }, "json");
}
