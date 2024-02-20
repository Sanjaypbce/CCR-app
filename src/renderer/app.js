
require("angular")
const fs = require('fs')
require("angular-route")
const $ = require("jquery")
const { ipcRenderer } = require("electron")
const { event } = require("jquery")
const path = require('node:path')
const os = require('os');
require("./index.css")
var myApp = angular.module(`myApp`, [`ngRoute`])
const image = new Image()
var imgpath
var file
var SECRET_KEY = 'Magnemite';
var recorder;
var blobs = [];
var videoname;
var video;
var blob
var videoURL
var bse64;
var resizedDataUrl;
var enpass


myApp.config(function ($routeProvider) {
    $routeProvider
        .when('/', {
            templateUrl: `./components/home/home.html`
        })
        .when('/loginpage', {
            templateUrl: `./components/loginpage/loginpage.html`
        })
        .when(`/registerpage`, {
            templateUrl: `./components/registerpage/registerpage.html`
        })
        .when(`/dashboardpage`, {
            templateUrl: `./components/dashboardpage/dashboard.html`
        })
        .when(`/workbenchpage`, {
            templateUrl: `./components/workbenchpage/workbenchpage.html`
        })
})
myApp.controller('mainController', ["$scope", "$location", "$timeout", function ($scope, $location, $timeout) {
    if (localStorage.getItem("loginuserposition") === null) {
        //...
        localStorage.setItem("loginuserposition", -1)
    }
    $scope.position = (JSON.parse(localStorage.getItem('loginuserposition')))
    if (!(localStorage.getItem("user") == null)) {
        $scope.allus = (JSON.parse(localStorage.getItem('user')))
        console.log($scope.allus)
        $scope.loginuser = $scope.allus[$scope.position]
    }
    $scope.userallvideo = []
    $scope.currentuserimg = []
    $scope.currentuservideo = []
    $scope.previousvideoname = ""
    $scope.encryptpassword
    if (!($scope.position == -1)) {
        $location.path("/dashboardpage")
        console.log($scope.loginuser)
        $scope.currentusername = $scope.loginuser.username
        $scope.currentuseremail = $scope.loginuser.useremail
        $scope.currentuserpassword = $scope.loginuser.userpassword
        $scope.currentuservideo = $scope.allus[$scope.position].videos
    }


    $scope.register = function (newusername, newuseremail, newuserpassword) {
        function validateEmail(newuseremail) {
            var re = /\S+@\S+\.\S+/;
            return re.test(newuseremail);
        }
        console.log(validateEmail(newuseremail)); // true
        $scope.encrp = async function (message) {
            const msgBuffer = new TextEncoder().encode(message);
            // hash the message
            const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
            // convert ArrayBuffer to Array
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            // convert bytes to hex string                  
            const hashHex = (hashArray.map(b => b.toString(16).padStart(2, '0')).join('')).slice(0, 10);
            $scope.encryptpassword = hashHex
            console.log(newusername, validateEmail(newuseremail), newuserpassword, $scope.encryptpassword)
            $scope.newuser = { username: (newusername), useremail: (newuseremail), userpassword: ($scope.encryptpassword), images: [], videos: [], clipboards: [] }
            console.log($scope.newuser)
            $scope.allus = [];
            if (!(localStorage.getItem("user") === null)) {
                $scope.allus = (JSON.parse(localStorage.getItem('user')))
            }
            $scope.allus.push($scope.newuser)
            localStorage.setItem("user", JSON.stringify($scope.allus))
            ipcRenderer.send("auth", $scope.newuser)
        }
        if (newusername && validateEmail(newuseremail) && newuserpassword) {
            $location.path("/loginpage")
            $scope.encrp(newuserpassword)
        }
    }
    $scope.login = function (loginusername, loginuserpassword) {
        $scope.encrpt = async function (message) {
            const msgBuffer = new TextEncoder().encode(message);
            // hash the message
            const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
            // convert ArrayBuffer to Array
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            // convert bytes to hex string                  
            const hashHex = (hashArray.map(b => b.toString(16).padStart(2, '0')).join('')).slice(0, 10);
            $scope.encryptpasswordforlogin = hashHex
            $scope.allus = (JSON.parse(localStorage.getItem('user')))
            console.log($scope.allus)
            $scope.position = $scope.allus.findIndex((i) => {
                return i.username == loginusername && i.userpassword == $scope.encryptpasswordforlogin;
            });
            console.log($scope.position)
            if (!($scope.position == -1)) {
                $scope.loginuser = $scope.allus[$scope.position]
                $scope.currentusername = $scope.loginuser.username
                $scope.currentuseremail = $scope.loginuser.useremail
                $scope.currentuserpassword = $scope.loginuser.userpassword
                $scope.userfound = true
                localStorage.setItem("loginuserposition", JSON.stringify($scope.position))
                let obj = {
                    username: $scope.loginuser.username,
                    useremail: $scope.loginuser.useremail,
                    userpassword: $scope.loginuser.userpassword,
                }
                $scope.dashboardpage($scope.userfound)
                ipcRenderer.send("signin", obj)
            }
            else {
                $("#loginuserpassword").css('border-color', 'red');
                $("#loginusername").css('border-color', 'red');
                $("#lat").css('border-color', 'red');
                setTimeout(function () {
                    $("#loginuserpassword").css('border-color', '#dee2e6');
                    $("#loginusername").css('border-color', '#dee2e6')
                    $("#lat").css('border-color', '#dee2e6')
                },
                    2000);
            }
        }
        $scope.encrpt(loginuserpassword)
    }
    $scope.dashboardpage = function (userfound, obj) {
        console.log(userfound)
        if (userfound) {

            $timeout(function () {
                $location.path("/dashboardpage")
            }, 1000);
        }
    }
    $scope.logout = function () {
        $scope.userallvideo = []
        $scope.currentuserimg = []
        $scope.currentuservideo = []
        $scope.position = -1
        localStorage.setItem('loginuserposition', JSON.stringify($scope.position))
        $location.path("/")
    }
    $scope.downloadimg = function (x) {
        let reresizedDataUrl = x.imgurl
        console.log(x)
        var a = document.createElement('a');
        a.href = reresizedDataUrl;
        a.download = reresizedDataUrl;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
    $scope.deleteimg = function (x) {
        var delimgindex = $scope.allus[$scope.position].images.findIndex((j) => {
            return x.imgname == j.imgname
        })
        $scope.allus[$scope.position].images.splice(delimgindex, 1)
        console.log($scope.allus[$scope.position].images)
        $scope.updatelocalstorage($scope.allus)
    }
    $scope.displayimgone = function (x) {
        $("#modeel").show()
        $("#imageshow").show()
        $("#imageshow").attr("src", x.imgurl)
    }
    $scope.closedisplayimgone = function () {
        $("#modeel").hide()
        $("#imageshow").hide()
    }
    $scope.displayvideoone = function (x) {
        $("#modeel1").show()
        $("#vidshow").show()
        $("#vidshow").attr("src", x.videourl)
    }
    $scope.closedisplayvidone = function () {
        $("#modeel1").hide()
        $("#vidshow").hide()
    }
    $scope.imgresizerselection = function () {
        $("#inav").addClass("active")
        $("#inav").siblings().removeClass()
        $("#dashboard").hide()
        $("#workpage").show()
        $("#imageresizer").show()
        $("#imageresizerpreview").hide()
        $("#screenrecorder").hide()
        $("#screenrecorderpreview").hide()
        $("#clipboard").hide()
        $("#clipboardpreview").hide()
        document.getElementById("saveimagebtn").disabled = true
        $("#inputGroupFile02").val("")
        $(".spaceforimageinside").html(`<img
        src="../../bin/Assets/image/depositphotos_89250312-stock-illustration-photo-picture-web-icon-in.jpg"
        style="width: 150px; height: 120px;">`)
        $("#width").val("")
        $("#height").val("")
    }
    $scope.imageresizerpreviewpage = function () {
        $scope.currentuserimg = []
        $("#dashboard").hide()
        $("#workpage").show()
        $scope.currentuserimg = $scope.allus[$scope.position].images
        $scope.currentuserimg.forEach(e => {
            e.$$hashKey = ""
        })
        $("#imageresizer").hide()
        $("#imageresizerpreview").show()
        $("#screenrecorder").hide()
        $("#screenrecorderpreview").hide()
        $("#clipboard").hide()
        $("#clipboardpreview").hide()
    }
    $scope.screenrecorderselection = function () {
        $("#snav").addClass("active")
        $("#snav").siblings().removeClass()
        $("#dashboard").hide()
        $("#workpage").show()
        $("#imageresizer").hide()
        $("#imageresizerpreview").hide()
        $("#screenrecorder").show()
        $("#screenrecorderpreview").hide()
        $("#clipboard").hide()
        $("#clipboardpreview").hide()
        document.getElementById("downloadvideobtn").disabled = true
        document.getElementById("savevideobtn").disabled = true
    }
    function b64toBlob(dataURI) {
        var byteString = atob(dataURI.split(',')[1]);
        var ab = new ArrayBuffer(byteString.length);
        var ia = new Uint8Array(ab);
        for (var i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        return new Blob([ab], { type: 'video/webm' });
    }
    $scope.screenrecorderpreviewselection = function () {
        $scope.userallvideo = []
        console.log($scope.allus)
        $scope.currentuservideo = $scope.allus[$scope.position].videos
        console.log($scope.currentuservideo)
        $scope.currentuservideo.forEach(element => {
            var newblob = b64toBlob(element.videobse64)
            var newurl = window.URL.createObjectURL(newblob)
            var newname = element.videoname
            var vidobj = {
                videoname: newname,
                videourl: newurl
            }
            $scope.userallvideo.push(vidobj)
        });
        $("#dashboard").hide()
        $("#workpage").show()
        $("#imageresizer").hide()
        $("#imageresizerpreview").hide()
        $("#screenrecorder").hide()
        $("#screenrecorderpreview").show()
        $("#clipboard").hide()
        $("#clipboardpreview").hide()
    }
    $scope.deletevideo = function (x) {
        console.log($scope.allus)
        console.log($scope.currentuservideo)
        var videoindex = $scope.currentuservideo.findIndex((e) => {
            return e.filename == x.filename
        })
        console.log(videoindex)
        $scope.currentuservideo.splice(videoindex, 1)
        $scope.userallvideo.splice(videoindex, 1)
        $scope.updatelocalstorage($scope.allus)
    }
    $scope.clipboardselection = function () {
        $("#cnav").addClass("active")
        $("#cnav").siblings().removeClass()
        $("#dashboard").hide()
        $("#workpage").show()
        $("#imageresizer").hide()
        $("#imageresizerpreview").hide()
        $("#screenrecorder").hide()
        $("#screenrecorderpreview").hide()
        $("#clipboard").show()
        $("#clipboardpreview").hide()
    }
    $scope.clipboardselectionpreview = function () {
        $("#dashboard").hide()
        $("#workpage").show()
        $("#imageresizer").hide()
        $("#imageresizerpreview").hide()
        $("#screenrecorder").hide()
        $("#screenrecorderpreview").hide()
        $("#clipboard").hide()
        $("#clipboardpreview").show()
        navigator.clipboard.readText()
            .then(text => {
                console.log('Pasted content: ', text);
            })
            .catch(err => {
                console.error('Failed to read clipboard contents: ', err);
            });
        setTimeout(async () => {
            const text = await navigator.clipboard.readText();
            console.log(text);
        }, 5000);
    }
    $scope.saveimage = function () {
        var w = $("#width").val()
        var h = $("#height").val()
        var curimg = {
            imgname: file.name,
            imgpath: imgpath,
            imgwidth: w,
            imgheight: h,
            imgurl: resizedDataUrl
        }
        console.log(curimg)
        $scope.allus[$scope.position].images.push(curimg)
        $scope.updatelocalstorage($scope.allus)
        $scope.notificationshow("Image is stored to the users database")
        $scope.imgresizerselection()
    }
    $scope.currentusersavevideo = function () {
        console.log(videoURL)
        console.log(bse64)
        console.log(videoname)
        var vid = {}
        vid.videoname = videoname
        vid.videobse64 = bse64
        $scope.currentuservideo.push(vid)
        $scope.allus[$scope.position].videos = $scope.currentuservideo
        $scope.notificationshow("video is stored to the users database")
        $scope.updatelocalstorage($scope.allus)
    }
    $scope.selectimage = function imgselection(e) {
        file = e.target.files[0]
        image.id = "choosedimg"
        image.src = URL.createObjectURL(file)
        imgpath = e.target.files[0].path
        image.onload = function () {
            $("#width").val(this.width)
            $("#height").val(this.height)
            $(".spaceforimageinside").html(image)
            $(".spaceforimageinside img").css({ "width": "150px", "height": "120px" })
            $("#filename").html((file.name))
        }
    }
    $scope.imgresize = function imgresize() {
        document.getElementById("saveimagebtn").disabled = false
        const input = document.getElementById("inputGroupFile02")
        var width = $("#width").val()
        var height = $("#height").val()
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const img = new Image();
                img.src = e.target.result;
                img.onload = function () {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);
                    resizedDataUrl = canvas.toDataURL('image/jpeg'); // Change format if needed
                    // You can use the resizedDataUrl as the source for an <img> tag or send it to a server, etc.
                    console.log(resizedDataUrl);
                    var a = document.createElement('a');
                    a.href = resizedDataUrl;
                    a.download = resizedDataUrl;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                };
            };

            reader.readAsDataURL(input.files[0]);
        }
    }

    ipcRenderer.on("stoprec", () => {
        $scope.stopRecording()
    })
    $scope.minbtn = function () {
        ipcRenderer.send('min-btn', 'hii')
    }
    $scope.maxbtn = function () {
        ipcRenderer.send('max-btn', 'hii')
    }
    $scope.closebtn = function () {
        ipcRenderer.send('close-btn', 'hii')
    }
    $scope.updatelocalstorage = function (data) {
        localStorage.setItem("user", JSON.stringify(data))
    }
    $scope.downloadtext = function () {
        var textfile = $("#inputt").val()
        var filename = $("#textname").val()
        if (textfile && filename) {
            console.log(textfile, filename)
            inputValue = {}
            inputValue.filename = filename
            inputValue.inputText = textfile
            ipcRenderer.send("dowloadtextinfolder", inputValue)
        }
    }
    $scope.startrecording = function () {
        $("#novideoimg").hide()
        $("video").show()
        $('#playimg').hide()
        $("#recimg").show()
        // $("#videostopbtn").attr("ng-click","stopRecording()")
        ipcRenderer.send('min-btn', 'hii')
        console.log("play")
        ipcRenderer.send('screen:record')
        ipcRenderer.on('SET_SOURCE', async (event, sourceId) => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: false,
                    video: {
                        mandatory: {
                            chromeMediaSource: 'desktop',
                            chromeMediaSourceId: sourceId,
                            minWidth: 800,
                            maxWidth: 1280,
                            minHeight: 600,
                            maxHeight: 720
                        }
                    }
                })
                $scope.handleStream(stream)
            } catch (e) {
                $scope.handleError(e)
            }
        })
    }
    $scope.handleStream = function (stream) {
        video = document.querySelector('video')
        video.srcObject = stream
        video.onloadedmetadata = (e) => video.play()
        console.log(video.srcObject)
        videoname = String(video.srcObject.id) + `.webm`
        recorder = new MediaRecorder(stream);
        blobs = [];
        recorder.ondataavailable = function (event) {
            blobs.push(event.data);
        };
        recorder.start();
    }
    $scope.handleError = function (e) {
        console.log(e)
    }
    $scope.stopRecording = function () {
        if (!($scope.previousvideoname == videoname)) {
            $("#novideoimg").show()
            $("video").hide()
            $('#playimg').show()
            $("#recimg").hide()
            document.getElementById("downloadvideobtn").disabled = false
            document.getElementById("savevideobtn").disabled = false
            function blobToBase64(blob) {
                return new Promise((resolve, _) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.readAsDataURL(blob[0]);
                });
            }
            recorder.onstop = async (e) => {
                console.log("data available after MediaRecorder.stop() called.");
                blob = new Blob(blobs, { type: "video/webm; codecs=opus" });
                videoURL = window.URL.createObjectURL(blob);
                bse64 = await blobToBase64(blobs);
                console.log("recorder stopped", videoURL, bse64);
            };
            recorder.stop();
            $scope.previousvideoname = videoname
        }
    }
    $scope.notificationshow = function (content) {
        ipcRenderer.send("notify", content)
    }
    $scope.downloadvideo = function () {
        console.log(videoname)
        recorder.stop()
        $scope.toArrayBuffer(new Blob(blobs, { type: 'video/webm' }), function (ab) {
            var buffer = $scope.toBuffer(ab);
            const loc = path.join(os.homedir(), "Downloads")
            var file = loc + "/" + videoname
            console.log(file)
            fs.writeFile(file, buffer, function (err) {
                if (err) {
                    console.error('Failed to save video ' + err);
                } else {
                    console.log('Saved video: ' + file);
                }
            });
        });
        $scope.notificationshow('Video is saved successfully')
    }
    $scope.toArrayBuffer = function (blob, cb) {
        let fileReader = new FileReader();
        fileReader.onload = function () {
            let arrayBuffer = this.result;
            cb(arrayBuffer);
        };
        fileReader.readAsArrayBuffer(blob);
    }
    $scope.handleUserMediaError = function (e) {
        console.error('handleUserMediaError', e);
    }
    $scope.toBuffer = function (ab) {
        return Buffer.from(ab);
    }
    ipcRenderer.on("copiedtext", (e, text) => {
        previouscopiedtext = $("#inputt").val()
        $("inputt").trigger("click")
        currentcopiedtext = text
        $("#inputt").val(previouscopiedtext + currentcopiedtext)
    })
    //checking for another
}]);










