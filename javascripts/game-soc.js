
// http://createjs.com/#!/TweenJS/demos/sparkTable
// http://createjs.com/Docs/TweenJS/modules/TweenJS.html
// view-source:http://createjs.com/Demos/EaselJS/Game.html COPY THIS
var stage, w, h, loader, pipe1height, pipe2height, 
    pipe3height, startX, startY, wiggleDelta, topFill, 
    fbuid, background, bird, ground, pipe, bottomPipe, 
    pipes, rotationDelta, counter, counterOutline, highScore, 
    highScoreOutline;
var started = false; 
var startJump = false; // Has the jump started?

var jumpAmount = 120; // How high is the jump?
var jumpTime = 266;

var dead = false; // is the bird dead?
var KEYCODE_SPACE = 32;     //usefull keycode
var gap = 250;
var masterPipeDelay = 1.5; // delay between pipes
var pipeDelay = masterPipeDelay; //counter used to monitor delay
var rd = 0;



var counterShow = false;

document.onkeydown = handleKeyDown;

function init() {

    // createjs.MotionGuidePlugin.install();

    stage = new createjs.Stage("testCanvas");

    createjs.Touch.enable(stage);
    // stage.canvas.width = document.body.clientWidth; //document.width is obsolete
    // stage.canvas.height = document.body.clientHeight; //document.height is obsolete
    
    // grab canvas width and height for later calculations:
    w = stage.canvas.width;
    h = stage.canvas.height;

    manifest = [
        {src:"img/bird.png", id:"bird"},
        {src:"img/background.png", id:"background"},
        {src:"img/ground.png", id:"ground"},
        {src:"img/pipe.png", id:"pipe"},
        {src:"img/restart.png", id:"start"},
        {src:"img/score-v2.png", id:"score"},
        {src:"img/share.png", id:"share"},
        {src:"fonts/FB.eot"},
        {src:"fonts/FB.svg"},
        {src:"fonts/FB.ttf"},
        {src:"fonts/FB.woff"}
    ];

    loader = new createjs.LoadQueue(false);
    loader.addEventListener("complete", handleComplete);
    loader.loadManifest(manifest);
}

function handleComplete() {
    
    background = new createjs.Shape();
    background.graphics.beginBitmapFill(loader.getResult("background")).drawRect(0,0,w,h);
    background.y = 0 + outerPadding
    
    var groundImg = loader.getResult("ground");
    ground = new createjs.Shape();
    ground.graphics.beginBitmapFill(groundImg).drawRect(0, 0, w+groundImg.width, groundImg.height);
    ground.tileW = groundImg.width;
    ground.y = h-groundImg.height-outerPadding;
    

    var data = new createjs.SpriteSheet({
        "images": [loader.getResult("bird")],
        //set center and size of frames, center is important for later bird roation
        "frames": {"width": 92, "height": 64, "regX": 46, "regY": 32, "count": 3}, 
        // define two animations, run (loops, 0.21x speed) and dive (returns to dive and holds frame one static):
        "animations": {"fly": [0, 2, "fly", 0.21], "dive": [1, 1, "dive", 1]}
    });
    bird = new createjs.Sprite(data, "fly");

    startX = (w/2) - (92/2)
    startY = 512 + outerPadding
    wiggleDelta = 18

    // Set initial position and scale 1 to 1
    bird.setTransform(startX, startY, 1, 1);
    // Set framerate
    bird.framerate = 30;

    //338, 512
    // Use a tween to wiggle the bird up and down using a sineInOut Ease
    createjs.Tween.get(bird, {loop:true}).to({y:startY + wiggleDelta}, 380, createjs.Ease.sineInOut).to({y:startY}, 380, createjs.Ease.sineInOut);

    stage.addChild(background);
    
    // Add padding to the top to make up for the small background graphic
    topFill = new createjs.Graphics()
    topFill.beginFill("#70c5ce").rect(0, 0, w, outerPadding); //color of the sky
    topFill = new createjs.Shape(topFill)
    stage.addChild(topFill)

    pipes = new createjs.Container(); 
    stage.addChild(pipes)

    stage.addChild(bird, ground);
    stage.addEventListener("stagemousedown", handleJumpStart);


    // Same thing as topFill on the bottom, but after the bird, ground 
    // and pipes because they'll always be behind this layer
    bottomFill = new createjs.Graphics()
    bottomFill.beginFill("#ded895").rect(0, h - outerPadding, w, outerPadding); //color of the ground
    bottomFill = new createjs.Shape(bottomFill)
    stage.addChild(bottomFill)

    counter = createText(false, "#ffffff", 1, '86px')
    counterOutline = createText(true, "#000000", 1, '86px')
    highScore = createText(false, "#ffffff", 0, '60px')
    highScoreOutline = createText(true, "#000000", 0, '60px')


    stage.addChild(counter, counterOutline)

    createjs.Ticker.timingMode = createjs.Ticker.RAF;
    createjs.Ticker.addEventListener("tick", tick);

    setHeight()

    if (supports_html5_storage()) {
        var storage = localStorage.getItem("highScore");
        fbuid = localStorage.getItem("fbuid")

        if (storage) {
            highScore.text = storage
            highScoreOutline.text = storage
        } else {
            localStorage.setItem("highScore", 0);
        }
        if (!fbuid) {
            fbuid = CryptoJS.SHA1(Date.now().toString() + Math.random().toString()).toString();
            localStorage.setItem("fbuid", fbuid);
        }
    } else {
        var myCookie = document.cookie.replace(/(?:(?:^|.*;\s*)highScore\s*\=\s*([^;]*).*$)|^.*$/, "$1");
        fbuid = document.cookie.replace(/(?:(?:^|.*;\s*)fbuid\s*\=\s*([^;]*).*$)|^.*$/, "$1");
        if (myCookie) {
            highScore.text = myCookie
            highScoreOutline.text = myCookie
        } else {
            document.cookie = "highScore=0"
        }
        if (!fbuid) {
            fbuid = CryptoJS.SHA1(Date.now().toString() + Math.random().toString()).toString();
            document.cookie = "fbuid=" + fbuid
        }
    }
}

function handleKeyDown(e) {
    //cross browser issues exist
    if(!e){ var e = window.event; }
    switch(e.keyCode) {
        case KEYCODE_SPACE: handleJumpStart();
    }
}

function handleJumpStart() {
    if (!dead) {
        createjs.Tween.removeTweens ( bird )
        bird.gotoAndPlay("jump");
        startJump = true
        if (!started) {
            started = true
            counterShow = true 
            rd = 0;                       
        }
    }
}

function diveBird() {
    bird.gotoAndPlay("dive");
}

function restart() {
    //hide anything on stage and show the score
    $('iframe.social').attr('src', '').hide();
    pipes.removeAllChildren();
    createjs.Tween.get(start).to({y:start.y + 10}, 50).call(removeStart)
    counter.text = 0
    counterOutline.text = 0
    counterOutline.alpha = 0
    counter.alpha = 0
    counter.font = "86px 'Flappy Bird'"
    counterOutline.font = counter.font
    counter.y = 150 + outerPadding
    counter.x = 384
    counterOutline.y = counter.y
    counterOutline.x = counter.x
    counterShow = false
    highScore.alpha = 0
    highScoreOutline.alpha = 0
    pipeDelay = masterPipeDelay
    dead = false
    started = false
    startJump = false
    createjs.Tween.removeTweens ( bird )
    bird.x = startX
    bird.y = startY
    bird.rotation = 0
    createjs.Tween.get(bird, {loop:true}).to({y:startY + wiggleDelta}, 380, createjs.Ease.sineInOut).to({y:startY}, 380, createjs.Ease.sineInOut);
}

function die() {
    console.log(rd)
    dead = true
    bird.gotoAndPlay("dive");

    ga('send', 'event', "Flappy Bird", "Score", counter.text, counter.text)
    if (counter.text > highScore.text) {
        highScore.text = counter.text
        highScoreOutline.text = counterOutline.text

        if (supports_html5_storage()) {
            localStorage.setItem("highScore", counter.text)
        } else {
            document.cookie = "highScore=" + counter.text
        }
    }

    createjs.Tween.removeTweens ( bird )
    createjs.Tween.get(bird).wait(0).to({y:bird.y + 200, rotation: 90}, (380)/1.5, createjs.Ease.linear) //rotate back
            .call(diveBird) // change bird to diving position
            .to({y:ground.y - 30}, (h - (bird.y+200))/1.5, createjs.Ease.linear); //drop to the bedrock
    createjs.Tween.get(stage).to({alpha:0}, 100).to({alpha:1}, 100)

    score = addImage('score', 270, 30)
    start = addImage('start', 155, 800)
    share = addImage('share', 399, 800)

    console.log(score)

    stage.removeChild(counter, counterOutline)

    stage.addChild(score)
    stage.addChild(start)
    stage.addChild(share)

    counter.y = 82
    counter.x = 330
    counter.font = "60px 'Flappy Bird'"
    counterOutline.y = counter.y
    counterOutline.x = counter.x
    counterOutline.font = "60px 'Flappy Bird'"
    counter.alpha = 0
    counterOutline.alpha = 0

    // highScore.text = 30
    // highScoreOutline.text = 30
    highScore.y = 82
    highScore.x = 440
    highScoreOutline.y = highScore.y
    highScoreOutline.x = highScore.x

    stage.addChild(counter, counterOutline, highScore, highScoreOutline)

    dropIn(score)
    dropIn(start)
    dropIn(counter)
    dropIn(counterOutline)
    dropIn(highScore)
    dropIn(highScoreOutline)
    share.y = share.y - 50 //removing movement that animation is about to do
    createjs.Tween.get(share).to({alpha:1, y: share.y + 50}, 400, createjs.Ease.sineIn).call(addClickToStart)

    $('iframe.social')
        .attr('src', 'http://localhost:3000/?score=' + counter.text + '&fbuid=' + fbuid + '&rd=' + rd) //192.168.1.134:8000 localhost:3000
        .show();
    centerSocial()
    
}
function centerSocial() {
    //768
    var scale = $('canvas').height()/1024,
        width = 0.8*768*scale,
        height = 0.6*1024*scale,
        top = 1024*0.15*scale,
        left = $(window).width()/2 - width/2
    $('iframe.social').css({
            'width':width,
            'height':height,
            'top':top,
            'left':left,
            'margin-top':$('canvas').css('margin-top')
        })
}
$(window).resize(function() {
    centerSocial()
})

function removeStart() {
    stage.removeChild(start)
    stage.removeChild(share)
    stage.removeChild(score)
}
function addClickToStart(item) {
    start.addEventListener("click", restart);
    share.addEventListener("click", goShare);
}

function dropIn(item) {
    item.y = item.y - 50 //removing movement that animation is about to do
    createjs.Tween.get(item).to({alpha:1, y: item.y + 50}, 400, createjs.Ease.sineIn)
}

function addImage(id, x, y) {
    var image = new createjs.Bitmap(loader.getResult(id));
    image.alpha = 0
    image.x = x //w/2 - image.image.width/2 + xOffset
    image.y = y //h/2 - image.image.height/2 + yOffset
    return image
}

function createText(isOutline, color, alpha, fontSize) {
    var text = new createjs.Text(0, fontSize + " 'Flappy Bird'", color);
    if (isOutline) {
        text.outline = 5
    }
    text.color = color
    text.textAlign = 'center'
    text.x = w/2
    text.y = 150 + outerPadding
    text.alpha = alpha
    return text
}

function goShare() {
    var countText
    if (counter.text == 1) {
        countText = "1 point"
    } else {
        countText = counter.text + " points"
    }
    window.open("https://twitter.com/share?url=http%3A%2F%2Fflappybird.io&text=I scored " + countText +  " on HTML5 Flappy Bird.");
}

// function showAd() {
//     $('.in-game-unit')
// }

function supports_html5_storage() {
    try {
        localStorage.setItem("test", "foo")
        return 'localStorage' in window && window['localStorage'] !== null;
    } catch (e) {
        return false;
    }
}

function tick(event) {
    var deltaS = event.delta/1000;

    var l = pipes.getNumChildren();

    if (bird.y > (ground.y - 40)) {
        if (!dead) {
            die()
        }
        if (bird.y > (ground.y - 30)) {
            createjs.Tween.removeTweens ( bird )
        }
    }
    
    if (!dead) {
        ground.x = (ground.x-deltaS*300) % ground.tileW;
    }


    if (started && !dead) {
        rd = rd + event.delta
        if (pipeDelay < 0) {

            pipe = new createjs.Bitmap(loader.getResult("pipe"));
            pipe.x = w+600
            pipe.y = (ground.y - gap*2) * Math.random() + gap*1.5
            pipes.addChild(pipe);
            // createjs.Tween.get(pipe).to({x:0 - pipe.image.width}, 5100)

            pipe2 = new createjs.Bitmap(loader.getResult("pipe"));
            pipe2.scaleX = -1
            pipe2.rotation = 180
            pipe2.x = pipe.x //+ pipe.image.width
            pipe2.y = pipe.y - gap
            // createjs.Tween.get(pipe2).to({x:0 - pipe.image.width}, 5100)

            pipes.addChild(pipe2);

            pipeDelay = masterPipeDelay

        } else {
            pipeDelay = pipeDelay - 1*deltaS
        }
        for(var i = 0; i < l; i++) {
            pipe = pipes.getChildAt(i);
            if (pipe) {
                if (true) { // tried replacing true with this, but it's off: pipe.x < bird.x + 92 && pipe.x > bird.x 
                    var collision = ndgmr.checkRectCollision(pipe,bird,1,true)
                    if (collision) {
                        if (collision.width > 8 && collision.height > 8) {
                            die()
                        }
                    }
                }
                pipe.x = (pipe.x - deltaS*300);
                if (pipe.x <= 338 && pipe.rotation == 0 && pipe.name != "counted") {
                    pipe.name = "counted" //using the pipe name to count pipes
                    counter.text = counter.text + 1
                    counterOutline.text = counterOutline.text + 1
                }
                if (pipe.x + pipe.image.width <= -pipe.w) { 
                    pipes.removeChild(pipe)
                }
            }
        }
        if (counterShow) {
            counter.alpha = 1
            counterOutline.alpha = 1
            counterShow = false
        }

    }



    if (startJump == true) {
        startJump = false
        bird.framerate = 60;
        bird.gotoAndPlay("fly");
        if (bird.roation < 0) {
            rotationDelta = (-bird.rotation - 20)/5
        } else {
            rotationDelta = (bird.rotation + 20)/5
        }
        if (bird.y < -200) {
            bird.y = -200
        }
        createjs
            .Tween
            .get(bird)
            .to({y:bird.y - rotationDelta, rotation: -20}, rotationDelta, createjs.Ease.linear) //rotate to jump position and jump bird
            .to({y:bird.y - jumpAmount, rotation: -20}, jumpTime - rotationDelta, createjs.Ease.quadOut) //rotate to jump position and jump bird
            .to({y:bird.y}, jumpTime, createjs.Ease.quadIn) //reverse jump for smooth arch
            .to({y:bird.y + 200, rotation: 90}, (380)/1.5, createjs.Ease.linear) //rotate back
            .call(diveBird) // change bird to diving position
            .to({y:ground.y - 30}, (h - (bird.y+200))/1.5, createjs.Ease.linear); //drop to the bedrock
    }

    
    stage.update(event);
}