//Program Logic:
//Get selected room
//Get the possible users 
//Get the location of each users and compare with the selected room
//Compare the last seen time with the current time, if less than 3 mins,
//Send email notification

var requestEmail = "chiyuc2@uci.edu"
var TIPPERS_HOST = "http://sensoria.ics.uci.edu:8059";

var API_USER_GET = TIPPERS_HOST + "/user/get";
var API_INFRASTRUCTURE_GET = TIPPERS_HOST + "/infrastructure/get";
var API_SEMANTICOBSERVATION_GET;
var API_SEND_CONTACT_NOTIFICATION =TIPPERS_HOST + "/message/send/person";


var emailList = [];
var targetList = [];
var reminderNum = 0;

function getRooms(){
    var rooms = [];

    $.ajax({
        type: 'GET',
        url: API_INFRASTRUCTURE_GET,
	    dataType: 'json',
        async: true,
        
        success: function(data){
            var jsonD = data;
            console.log("1");
            var dropDown="<option>N/A</option>";
            $.each(data,function(key,value){
                dropDown += "<option>" + 'Room: '+ value.name +' (area: '+ value.area +")</option>";
                //console.log(value.name);
            });
            
            $('#room').empty();
            $('#room').append(dropDown);

            $('#room').select2({
			});
        },
        error:function(e){
            console.log("can't get room list");
        }
    });
}

function getCurrentTime(){
 //get time 
 var currentdate = new Date(); 
 date = currentdate.getFullYear() + "-" + (currentdate.getMonth()+1) + "-" + (currentdate.getDate());
 console.log(date);

 var s_time = "";
 if (currentdate.getHours() < 10)
 {
     s_time += '0' + currentdate.getHours() + ":"
 }
 else
 {
     s_time += currentdate.getHours() + ":";	
 }
 
 if (currentdate.getMinutes() > 10){
     if (currentdate.getMinutes() < 20)
     {
         s_time += '0' + (currentdate.getMinutes()-10) + ":"
     }
     else
     {
         s_time += (currentdate.getMinutes()-10) + ":";
     }

     if (currentdate.getSeconds()< 10)
     {
         s_time += '0' + currentdate.getSeconds();
     }
     else
     {
         s_time += currentdate.getSeconds();
     }
 }
 else
 {
     s_time += "00:" 
     if (currentdate.getSeconds()< 10)
     {
         s_time += '0' + currentdate.getSeconds();
     }
     else
     {
         s_time += currentdate.getSeconds();
     }
 }
     
 var h1 = "";
 if (currentdate.getHours() < 10)
 {
     h1 = '0' + currentdate.getHours();
 }
 else
 {
     h1 = currentdate.getHours();
 }

 var m1 = "";
 if (currentdate.getMinutes() < 10)
 {
     m1 = '0' + currentdate.getMinutes();
 }
 else
 {
     m1 = currentdate.getMinutes();
 }				

 var s1 = "";
 if (currentdate.getSeconds() < 10)
 {
     s1 = '0' + currentdate.getSeconds();
 }
 else
 {
     s1 = currentdate.getSeconds();
 }
 e_time = h1 + ":" +  m1 + ":" + s1;
 
 var res = date + "%20" + s_time + "&end_timestamp=" + date +  "%20" + e_time;

 return res;

}

function getPossibleUsers(){
    

    $.ajax({
        'url': API_USER_GET,
        'type': 'GET',
        'dataType': "json",
        async: false,

        success: function(data) {
        
            $.each(data, function(key, value) {
                if( value.email != requestEmail )
                    var tmp = value;
                    targetList.push(tmp);
            });	
            //console.log(targetList);
              
            $('#people').empty();
            $('#selectLocation').empty();
            $('#loading').empty();
            //loop the target user list and try to get the location
            for(var i=0;i<targetList.length;i++){
                if(targetList[i]!=undefined){
                    var perc = (i/targetList.length)*100;
                    getLocation(targetList[i].email,targetList[i].name,perc);
                    }
            }
            },
        error: function(e){
            console.log("get possible users error");
        }
    });
}

function getLocation(email,name,percent){
    var currentTimeStamp = getCurrentTime();
    API_SEMANTICOBSERVATION_GET = "http://sensoria.ics.uci.edu:8059/semanticobservation/get?requestor_id=" + requestEmail + 
    "&service_id=7&subject_id="+ email + "&type=4&start_timestamp=" + currentTimeStamp +"&region=true";

    $.ajax({
        type: 'GET',
        url: API_SEMANTICOBSERVATION_GET,
        dataType: 'json',
        success: function(data) { 
            var jsonData = data;       
            var length = jsonData.length;
            //console.log(email);
            //console.log(length);
            $('#loading').empty();
            percent = percent.toFixed(0);
            if(percent == 99){
                percent = 100;
            }
            $('#loading').append("Checking: " + percent+"%");
            if(length > 0){
                //In the building/
                //loop the possible data and select the buidling with highest confidence
                var location;
                var confidence =0;
                var area;
                
                for(var i=0;i<jsonData.length;i++){
                    var jsonObj = jsonData[i];
                    if(jsonObj.confidence > confidence){
                        location = jsonObj.payload.location;
                        area = jsonObj.payload.area;
                        confidence = jsonObj.confidence;
                    }
                }
                //console.log(email);
                var compare = 'Room: '+ location +' (area: '+ area +")";
                var targetRoom = $('#room').select2('val');
                //console.log(compare);
                //console.log(targetRoom);
                var res = '<option>'+name + " in " + compare+'</option>'
                $('#people').append(res);

                if(compare == targetRoom){
                    $('#selectLocation').append(res);
                    emailList.push(email);
                    //console.log("right!");
                }
                else{
                    //console.log("nOnono");
                }
                
            }
        },
        error:function(e){
            console.log("get semanticobservation error!");
        }
    
    })

}

function sendMessage(){
    console.log(emailList);
    var input_subj_msg = document.getElementById("subj_msg").value;
    var input_msg = document.getElementById("msg").value;
    var confirm_msg = "Are you sure you want to send the message :   " + input_msg + "      to ";

    reminderNum = document.getElementById("num").value;

    for(var i = 0; i<emailList.length; i++){
        confirm_msg += emailList[i] + "    "
    }
    var res = confirm(confirm_msg);
    confirm_msg = confirm_msg.replace(/(\r\n|\n|\r)/gm,"");
    
    if(res == true){
        sendList(input_msg,input_subj_msg);
        reminderNum--;
        if(reminderNum>0){
        reminderSend(input_msg,input_subj_msg);
        }
    }
}

function sendList(msg,input_subj_msg){
    console.log("Send message to the email list user");
    for(var i =0; i<emailList.length;i++){
        Email.send({
            SecureToken : "05610e08-fe89-4df4-947d-05f0eedeead6",
            To : emailList[i],
            From : "cs223testemail@gmail.com",
            Subject : input_subj_msg,
            Body : msg
        }).then(
            message => alert(message)
        );
    }
}


function reminderSend(msg){
    setTimeout(function(){
        sendList(msg);
        reminderNum--;
        if(reminderNum > 0){
            reminderSend(msg);
        }
    },300000)
    
}


/*
// original method using the tipper API
function send1(content){
    $.ajax({ 
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        url: API_SEND_CONTACT_NOTIFICATION, 
        type: 'POST',   
        data: JSON.stringify(content),
        //async: false,
        dataType: 'json',     
        cache: false,
        success: function(data){ 
            console.log('inside sending - returning success');
            console.log(data);                     
        },
        complete: function(response, textStatus) {
            console.log(response);
            console.log(textStatus);
            console.log('request complete');
        },
        error:function(e){
            console.log('error on send message');
        }
    });
}


function send(content){
    Email.send({
        SecureToken : "12b7b230-0e13-44c2-9221-fb94896593d5", 
        Host : "smtp.gmail.com",
        Username : "cs223testemail@gmail.com",
        Password : "5d0ce4d6-d8ff-43dc-9446-67d41a2092c5",
        To : 'chiyuc2@gmail.com',
        From : "cs223testemail@gmail.com",
        Subject : "This is the subject",
        Body : "And this is the body"
    }).then(
      message => alert(message)
    );
}*/







