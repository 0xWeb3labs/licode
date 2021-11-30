
/* globals Erizo */

/* eslint-env browser */
/* eslint-disable no-param-reassign, no-console */

// const serverUrl = 'https://t.callt.net:8030/';
const serverUrl = '/';
let localStream;
let localStreamid;
let room;
let recording = false;
let recordingId = '';
const configFlags = {
  noStart: false, // disable start button when only subscribe
  forceStart: true, // force start button in all cases
  screen: false, // screensharinug
  room: '会客室',//'basicExampleRoom', // room name
//  roomId:'6180dae0d4edf07e00e3d70a',// node 001 - aliyun
  roomId:'618e850a0a18f32177d55a80',// node 002 - aws
  singlePC: false,
  type: 'erizo', // room type
  onlyAudio: true,
  mediaConfiguration: 'default',
  onlySubscribe: false,
  onlyPublish: false,
  autoSubscribe: false,
  simulcast: false,
  unencrypted: false,
};

function addPreZero4(num){
  return ('0000'+num).slice(-4);
}

const getParameterByName = (name) => {
  // eslint-disable-next-line
  name = name.replace(/[\[]/, '\\\[').replace(/[\]]/, '\\\]');
  const regex = new RegExp(`[\\?&]${name}=([^&#]*)`);
  const results = regex.exec(location.search);
  let parameter = configFlags[name];
  if (results !== null) {
    parameter = decodeURIComponent(results[1].replace(/\+/g, ' '));
    if (typeof configFlags[name] === 'boolean') {
      parameter = !!parseInt(parameter, 0);
    }
  }
  return parameter;
};

const fillInConfigFlagsFromParameters = (config) => {
  Object.keys(config).forEach((key) => {
    config[key] = getParameterByName(key);
  });
  console.log('Flags parsed, configuration is ', config);
};

// eslint-disable-next-line no-unused-vars
const testConnection = () => {
  window.location = '/connection_test.html';
};


// eslint-disable-next-line no-unused-vars
function startRecording() {
  if (room !== undefined) {
    if (!recording) {
      room.startRecording(localStream, (id) => {
        recording = true;
        recordingId = id;
        window.recordingId = recordingId;
      });
    } else {
      room.stopRecording(recordingId);
      recording = false;
    }
    window.recording = recording;
  }
}

let slideShowMode = false;
let isTalking = false;

// eslint-disable-next-line no-unused-vars
function toggleSlideShowMode() {
  const streams = room.remoteStreams;
  const cb = (evt) => {
    console.log('SlideShowMode changed', evt);
  };
  slideShowMode = !slideShowMode;
  streams.forEach((stream) => {
    if (localStream.getID() !== stream.getID()) {
      console.log('Updating config');
      stream.updateConfiguration({ slideShowMode }, cb);
    }
  });
}
function stopConference() {
  if (room) {
    if (isTalking)
      room.unpublish(localStream);
//    room.unsubscribe();
    room.disconnect();
  }
}
function talkMode() {
  if (configFlags.onlySubscribe) {
//    isTalking = false;
//     room.unpublish(localStream,function (event) {
//       console.log(JSON.stringify(event));
//     });
    configFlags.onlySubscribe = false;
    document.getElementById('talkMode').textContent = "Speaker";
  }
  else {
    // room.publish(localStream);
    configFlags.onlySubscribe = true;
//    isTalking=true;
    document.getElementById('talkMode').textContent = "Listener";
  }
}
function cameraMode() {
  if (configFlags.onlyAudio) {
    configFlags.onlyAudio = false;
    document.getElementById('cameraMode').textContent = "Video";
  }
  else {
    configFlags.onlyAudio = true;
    document.getElementById('cameraMode').textContent = "Audio";
  }
}

const getRooms = (callback)=>{
  const req = new XMLHttpRequest();
  const url = `${serverUrl}getRooms/`;

  req.onreadystatechange = () => {
    if (req.readyState === 4) {
      if (callback)
        callback(req.responseText);
    }
  };

  console.log(url);
  req.open('GET', url, true);
//    req.setRequestHeader('Content-Type', 'application/json');
  req.send();
};

const startBasicExample = () => {
  // document.getElementById('startButton').disabled = true;
  // document.getElementById('slideShowMode').disabled = false;
  document.getElementById('stopButton').disabled = true;
  document.getElementById('talkMode').disabled = false;
  document.getElementById('startWarning').hidden = true;
  document.getElementById('startButton').hidden = true;
  recording = false;
  console.log('Selected Room', configFlags.room, 'of type', configFlags.type);
  const name = addPreZero4(Math.round(Math.random() * 10000));
//  const config = { audio: true, video: false, data: true, videoSize: [640, 480, 640, 480],attributes: {avatar:name+"",id:name+"",actualName:"KADWEB"+name, name:"Test Connection "+name }};
  const config = { audio: true,
    video: !configFlags.onlyAudio,
    data: true,
    screen: configFlags.screen,
    attributes: { nickname: `web${name}`, actualName: `web${name}`, avatar: `${name}`, id: `${name}`, name: `${name}` } };
  // If we want screen sharing we have to put our Chrome extension id.
  // The default one only works in our Lynckia test servers.
  // If we are not using chrome, the creation of the stream will fail regardless.
  if (configFlags.screen) {
     config.extensionId = 'okeephmleflklcdebijnponpabbmmgeo';
  }
  Erizo.Logger.setLogLevel(Erizo.Logger.TRACE);
  localStream = Erizo.Stream(config);
  window.localStream = localStream;
  const createToken = (roomData, callback) => {
    const req = new XMLHttpRequest();
    const url = `${serverUrl}createToken/`;

    req.onreadystatechange = () => {
      if (req.readyState === 4) {
        callback(req.responseText);
      }
    };

    console.log(url);
    req.open('POST', url, true);
    req.setRequestHeader('Content-Type', 'application/json');
    req.send(JSON.stringify(roomData));
  };

  const roomData = { username: `用户 ${parseInt(Math.random() * 100, 10)}`,
    role: 'presenter',
    room: configFlags.room,
    roomId:configFlags.roomId,
    type: configFlags.type,
    mediaConfiguration: configFlags.mediaConfiguration };

  createToken(roomData, (response) => {
    const token = response;
    console.log(token);
    room = Erizo.Room({ token });
    window.room = room;

    const subscribeToStreams = (streams) => {
      if (configFlags.autoSubscribe) {
        return;
      }
      if (configFlags.onlyPublish) {
        return;
      }
      const cb = (evt) => {
        console.log('Bandwidth Alert', evt.msg, evt.bandwidth);
      };

      streams.forEach((stream) => {
        if (localStream.getID() !== stream.getID()) {
          room.subscribe(stream, { slideShowMode, metadata: { type: 'subscriber' }, video: !configFlags.onlyAudio, encryptTransport: !configFlags.unencrypted });
          //          room.subscribe(stream, { slideShowMode, metadata: { type: 'subscriber',nickname:"web"+name,actualName:"web"+name,avatar:name+"",id:name+"" }, video: !configFlags.onlyAudio, encryptTransport: !configFlags.unencrypted });
          stream.addEventListener('bandwidth-alert', cb);
        } else { stream.setAttributes({ actualName: `web${name}`, avatar: `${name}`, name }); }
      });
    };
//    room.on('connection-failed', console.log.bind(console));
    room.on('connection-failed', (roomEvent)=>{
//      console.log.bind(console);
      console.log('connection-failed:'+JSON.stringify(roomEvent));
    });

    room.addEventListener('room-disconnected', (roomEvent) => {
      document.getElementById('startButton').hidden = false;
      document.getElementById('startButton').disable = false;
      document.getElementById('stopButton').disabled = true;
      const element = document.getElementById('myAudio');
      if (element) { document.getElementById('videoContainer').removeChild(element); }
      $('#mform').submit(function(){
        console.log('can not send:'+$('#m').val());
      });
    });
    room.addEventListener('room-connected', (roomEvent) => {
      const options = { metadata: { type: 'publisher' } };
      if (configFlags.simulcast) options.simulcast = { numSpatialLayers: 3 };
      options.encryptTransport = !configFlags.unencrypted;
      subscribeToStreams(roomEvent.streams);

      if (!configFlags.onlySubscribe) {
        //        room.publish(localStream, options);
        room.publish(localStream, { maxVideoBW: 300, handlerProfile: 0 });
        localStream.addEventListener("stream-data", function(evt){
          console.log('Received data ', evt.msg, 'from stream ', evt.stream.getAttributes().name);
          $('#messages').append($('<li>').text(evt.msg));
        });

        localStream.sendData({text:"Hello, I am "+name});
//        stream.sendData({text:'Hello', timestamp:12321312});
        if (configFlags.onlySubscribe)
          document.getElementById('talkMode').textContent = "Speaker";
        else
          document.getElementById('talkMode').textContent = "Listener";
        if (configFlags.onlyAudio) {
          document.getElementById('cameraMode').textContent = "Audio";
        }
        else {
          document.getElementById('cameraMode').textContent = "Video";
        }

      }
      room.addEventListener('quality-level', (qualityEvt) => {
        console.log(`New Quality Event, connection quality: ${qualityEvt.message}`);
      });
      document.getElementById('startButton').disable = true;
      document.getElementById('stopButton').disabled = false;
      $('#mform').submit(function(){
        //socket.send($('#m').val());
        //  $('#messages').append($('<li>').text(msg.sender+":"+msg.data));
        let msg=$('#m').val();
        if (msg=='' || msg.length<1)
          return false;
        $('#messages').append($('<li style="background-color: #00C0E0">').text('Me:'+$('#m').val()));
        localStream.sendData({text:$('#m').val(),from:name});
        $('#m').val('');
        return false;
      });


    });

    room.addEventListener('stream-subscribed', (streamEvent) => {
      const stream = streamEvent.stream;
      const div = document.createElement('div');
      if (!stream.hasVideo()) {
        div.setAttribute('style', 'width: 78px; height: 78px;backgroud:yellow;float:left;padding:5px');
      } else {
        div.setAttribute('style', 'width: 320px; height: 240px;backgroud:yellow;float:left;padding-left:5px');
      }
      div.setAttribute('id', `test${stream.getID()}`);

      //      div.textContent=stream.getAttributes().actualName+"-"+stream.getAttributes().avatar;
      if (stream.getAttributes().avatar && stream.hasVideo() === false) {
        const img = document.createElement('img');
        img.setAttribute('style', 'border-radius:50%;width: 78px; height: 78px;background:antiquewhite;float:left;');
        img.setAttribute('id', stream.getAttributes().avatar);
        img.setAttribute('src', `https://www.larvalabs.com/public/images/cryptopunks/punk${stream.getAttributes().avatar}.png`);
        // img.textContent=stream.getAttributes().actualName;
        div.appendChild(img);
      }
      const label = document.createElement('label');
      label.setAttribute('style', 'width: 78px; font-size:small;text-align:center;');
      label.textContent = stream.getAttributes().actualName;
      //        div.appendChild("<label>"+stream.getAttributes().actualName+"</label>");
      div.appendChild(label);
      console.log(`${stream.hasVideo()} video appaend:${JSON.stringify(div)}`);
      document.getElementById('videoContainer').appendChild(div);
      stream.show(`test${stream.getID()}`);
      if (stream.hasVideo()) {
        document.getElementById('videoContainer').setAttribute('style', 'background:lightcyan;width:100%;min-height: 260px');
      }
      console.log(`${stream.getID()}:${JSON.stringify(stream.getAttributes())}`);
      stream.addEventListener("stream-data", function(evt){
        console.log('stream Received data ', evt.msg, 'from stream ', evt.stream.getAttributes().name);
        $('#messages').append($('<li>').text(evt.msg.from+":"+evt.msg.text));
      });

    });
    room.addEventListener('user_connection', (event) => {
      console.log(`${'user_connection:' + ':'}${JSON.stringify(event)}`);
    });
    room.on('user_connection', (event) => {
      console.log(`${'on user_connection:' + ':'}${JSON.stringify(event)}`);
    });

    room.addEventListener('stream-added', (streamEvent) => {
      const streams = [];
      streams.push(streamEvent.stream);
      const stream = streamEvent.stream;
      console.log(`stream-added${stream.getID()}:${JSON.stringify(stream.getAttributes())}`);
      // if (localStream) {
      //   localStream.setAttributes({ type: 'publisher',nickname:"web"+name,actualName:"web"+name,avatar:name+"",id:stream.getID()+"" });
      // }
      subscribeToStreams(streams);
//      document.getElementById('recordButton').disabled = false;
      if (localStream.getID() === stream.getID()) {
        document.getElementById('talkMode').disabled = false;
        isTalking = true;
        localStreamid = stream.getID();
      }
      });

    room.addEventListener('stream-removed', (streamEvent) => {
      // Remove stream from DOM
      const stream = streamEvent.stream;
      if (stream.elementID !== undefined) {
        const element = document.getElementById(stream.elementID);
        if (element) { document.getElementById('videoContainer').removeChild(element); }
      } else {
        const element = document.getElementById(`test${streamEvent.stream.getID()}`);
        if (element) { document.getElementById('videoContainer').removeChild(element); }
      }
      console.log(`${stream.getID()}:removed:${JSON.stringify(stream.getAttributes())}`);
      if (localStream.getID() === stream.getID() || localStreamid===stream.getID()) {
        const element = document.getElementById('myAudio');
        if (element) { document.getElementById('videoContainer').removeChild(element); }
//        document.getElementById('talkMode').disabled = true;
        isTalking = false;
      }

    });

    room.addEventListener('stream-failed', (evt) => {
      console.log('Stream Failed, act accordingly');
      console.log(JSON.stringify(evt));
    });


    if (configFlags.onlySubscribe) {
      room.connect({ singlePC: configFlags.singlePC });
    } else {
      localStream.addEventListener('access-accepted', () => {
        const div = document.createElement('div');
        room.connect();
        // room.connect({ singlePC: configFlags.singlePC });
        if (localStream.hasVideo()) {
          div.setAttribute('style', 'width: 320px; height: 240px; backgroud:lightgrey; float:left;padding-left:5px');
          div.setAttribute('id', 'myVideo');
          document.getElementById('videoContainer').appendChild(div);
          localStream.show('myVideo');
        } else {
          div.setAttribute('style', 'width: 78px; height: 78px;backgroud:green;float:left;;padding:5px');
          div.setAttribute('id', 'myAudio');
          document.getElementById('videoContainer').appendChild(div);
          const img = document.createElement('img');
          img.setAttribute('style', 'border-radius:50%;width: 78px; height: 78px;background:lightblue;float:left;');
          img.setAttribute('id', localStream.getAttributes().avatar);
          img.setAttribute('src', `https://www.larvalabs.com/public/images/cryptopunks/punk${localStream.getAttributes().avatar}.png`);
          // img.textContent=stream.getAttributes().actualName;
          div.appendChild(img);
          const label = document.createElement('label');
          label.setAttribute('style', 'width: 78px; font-size:small;text-align:center;text-decoration-line: underline;font-weight: bold;');
          label.textContent = localStream.getAttributes().actualName;
          div.appendChild(label);
          localStream.show('myAudio');
        }
      });
      localStream.addEventListener('access-denied', () => {
        //        room.connect({ singlePC: configFlags.singlePC });
        //        localStream.show('myVideo');
        console.log('access-denied');
      });
      localStream.init();
    }
  });
};

window.onload = () => {
  fillInConfigFlagsFromParameters(configFlags);
  window.configFlags = configFlags;
//  roomId:'6180dae0d4edf07e00e3d70a',// node 001 - aliyun
//  roomId:'618e850a0a18f32177d55a80',// node 002 - aws
  if (location.host.inlucdes('kad.network'))
    configFlags.roomId='618e850a0a18f32177d55a80';
  else
    if (location.host.inlucdes('callt.net'))
      configFlags.roomId='6180dae0d4edf07e00e3d70a';
  const shouldSkipButton =
    !configFlags.forceStart &&
    (!configFlags.onlySubscribe || configFlags.noStart);

  if (shouldSkipButton) {
    startBasicExample();
  } else {
    document.getElementById('startButton').disabled = false;
  }
  getRooms(function (roomlist) {
    console.log(JSON.stringify(roomlist));
    var rooms = JSON.parse(roomlist);
    for (let i=0;i<rooms.length;i++) {
      let ht='<a class="aaf" href="#" id=\"'+rooms[i]._id+'\">';
      $('#roomlist')
        .append($('<dt>')).append($(ht)
          .text(rooms[i].name))
      .append($('<dd>')
          .text( rooms[i]._id));
    }
    $('.aaf').on("click",function(){
      var text = $(this).text();  // 找到当前点击的dt下的a标签并获取其内容
      $('#myroom').text(text);
      configFlags.room=text;
      let id = $(this).attr('id');
      console.log(id);
      configFlags.roomId=id;
    })
    $('#newroom').submit(function(){
      let text = $('#room').val();
      $('#roomlist')
        .append($('<dt>')).append($('<a class="aaf" href="#">')
        .text(text))
      $('#myroom').text(text);
      configFlags.room=text;
      $('.aaf').on("click",function(){
        var text = $(this).text();  // 找到当前点击的dt下的a标签并获取其内容
        $('#myroom').text(text);
        configFlags.room=text;
      })
      return false;
    });

  })
};
