$(document).ready(function(){
    var user = {}; //本地用户对象
    var users = []; //所有用户
    var message = { //将要发送的信息

    };
    if(getCookie('nickname')){
        user.nickname = getCookie('nickname');
    }
    var wsServer = 'ws://123.206.28.242:2345';
    //调用websocket对象建立连接：
    //参数：ws/wss(加密)：//ip:port （字符串）
    var websocket = new WebSocket(wsServer);
    //onopen监听连接打开
    websocket.onopen = function (evt) {
    //websocket.readyState 属性：
    /*
    CONNECTING    0    The connection is not yet open.
    OPEN    1    The connection is open and ready to communicate.
    CLOSING    2    The connection is in the process of closing.
    CLOSED    3    The connection is closed or couldn't be opened.
    */
        if(websocket.readyState == 1){
            //$('*').attr('disabled',false);
            if(!user.nickname){
                $(".chat").css('display','none');
                layer.prompt({
                    title : '请输入昵称',
                    btn:['确定'],
                    cancel: function(index){
                        layer.msg('请输入昵称然后点击确定');
                        return false;
                    }
                },function(nickname,index,elem){
                    // if(!nickname){
                    //     layer.close(index);
                    //     layer.msg('昵称不能为空');
                    //     return;
                    // }
                    for(var i=0;i<users.length;i++){
                        if(users[i] == nickname){
                            layer.msg('该昵称已经存在,请重新输入');
                            return;
                        }

                    }
                    layer.close(index);
                    user.nickname = nickname;
                    setCookie('nickname',nickname);
                    message.type = 'users';
                    message.data = nickname;
                    websocket.send(JSON.stringify(message));
                    //console.log(JSON.stringify(message));
                    $('.nickname').css('display','none');
                    $('.chat').css('display','');
                    $('input:radio[name="user"]:checked').click();
                })
                
            }else{
                $(".nickname").css('display','none');
                //刷新页面时(存在cookie)
                message.type = 'users';
                message.data = user.nickname;
                websocket.send(JSON.stringify(message));

                message.type = 'record';
                message.data = 0;
                message.from = user.nickname;
                message.to = 'ALL';
                websocket.send(JSON.stringify(message));
            }
        }else if(websocket.readyState === 0){
            $('*').attr('disabled',true);

        }
    };

      //监听连接关闭
    websocket.onclose = function (evt) {
       $('.chat').hide();
        layer.alert('您已掉线,请刷新页面！');
   };

    //onmessage 监听服务器数据推送
    websocket.onmessage = function (evt) {
        var data = JSON.parse(evt.data);
        var checkeduser = $('input:radio[name="user"]:checked').val();
        switch(data.type){
            case 'users':
                users = data.data.split(',');
                users.pop();
                //console.log(users);
                var onlineuser = [];
                for(var j=0;j<users.length;j++){
                    if(users[j].split('-')[0] != user.nickname && users[j].split('-')[1] == 1){
                        onlineuser.push(users[j].split('-')[0]);
                    }
                    users[j] = users[j].split('-')[0];
                }
                $('#number').text('当前在线人数:'+(onlineuser.length+1));
                $('.user_list').html('');
                $('.user_list').append('<div><label><input type="radio" class="abc" name="user" value="ALL" checked="checked"/>ALL</label></div>');
                for(var i=0;i<onlineuser.length;i++){
                    if(onlineuser[i] != user.nickname)
                        $('.user_list').append('<div><label><input type="radio" class="abc" name="user" value="'+onlineuser[i]+'"/>'+onlineuser[i]+'</label></div>');
                }
                setTimeout(() => {
                    //单选框(用户)点击事件 获取聊天记录
                    $('.abc').click(function(){
                        $('.msg').html('');
                        message.type = 'record';
                        message.data = 0;
                        message.from = user.nickname;
                        message.to = $(this).val();
                        websocket.send(JSON.stringify(message));
                        
                    });
                }, 0);
                break;
            case 'image':
                if(data.from == checkeduser&&data.to==user.nickname){
                    $('.msg').append('<div class="txt from">'+data.from+'<img class="img " src="'+data.data+'" alt=""/></div>');
                }
                if(checkeduser == "ALL"&&data.to == "ALL"){
                    $('.msg').append('<div class="from txt">'+data.from+'<img class="img " src="'+data.data+'" alt=""/></div>');
                }
                $('.msg').scrollTop( $('.msg')[0].scrollHeight );
                break;
            case 'text':
                if(data.from === checkeduser&&data.to==user.nickname){
                    $('.msg').append('<div class="from txt">'+data.from+': '+data.data+'</div>');
                }
                if(checkeduser == "ALL"&&data.to=="ALL"){
                    $('.msg').append('<div class="from txt">'+data.from+': '+data.data+'</div>');
                }
                $('.msg').scrollTop( $('.msg')[0].scrollHeight );
                break;
            case 'record':
                var arr = data.data.substr(1,data.data.length-2).split(/,(?=\"\{)/);
                for(var i=0;i<arr.length;i++){
                    arr[i] = arr[i].substr(1,arr[i].length-2);
                    arr[i] = JSON.parse(arr[i]);
                }
                arr.sort(function(a,b){
                    return b.time - a.time;
                });
                for(i=0;i<arr.length;i++){
                    var obj = arr[i];
                    if(obj.type == 'text'){
                        if(obj.from == user.nickname)
                            $('.msg').prepend('<div class="to txt">'+obj.data+'</div>');
                        else
                            $('.msg').prepend('<div class="from txt">'+obj.from+': '+obj.data+'</div>');
                    }
                    else if(obj.type == 'image'){
                        if(obj.from == user.nickname)
                            $('.msg').prepend('<div class="txt to"><image class="img" src="'+obj.data+'"/></div>');
                        else
                            $('.msg').prepend('<div class="txt from">'+obj.from+': <image class="img" src="'+obj.data+'" alt=""/></div>');
                    }
                }
                $('.msg').scrollTop( $('.msg')[0].scrollHeight );
                break;
            case 'tag':
                if(data.data != 'OK'){
                    $('p.to:last').remove();
                    layer.msg('上一条信息发送失败');
                }
                break;
        }
        
//        console.log('Retrieved data from server: ' + evt.data);
    };
//监听连接错误信息
//    websocket.onerror = function (evt, e) {
//        console.log('Error occured: ' + evt.data);
//    };

    $(".nick_button").click(function(){
        var nickname = $('#nickname').val();
        if(!nickname){
            alert('昵称不能为空');
            return;
        }
        for(var i=0;i<users.length;i++){
            if(users[i] == nickname){
                alert('该昵称已经存在,请重新输入');
                return;
            }

        }
        user.nickname = nickname;
        setCookie('nickname',nickname);
        message.type = 'users';
        message.data = nickname;
        websocket.send(JSON.stringify(message));
        //console.log(JSON.stringify(message));
        $('.nickname').css('display','none');
        $('.chat').css('display','');
        $('input:radio[name="user"]:checked').click(); //登陆后模拟点击事件获取聊天记录
    });

    //发送消息
    $(".send_button").click(function(){

        if($('#text').val() && !$('#img').val()){
            message.data = $('#text').val();
            message.type = 'text';               
            message.from = user.nickname;
            message.to = $('input:radio[name="user"]:checked').val();
            message.time = (new Date()).getTime();
        //向服务器发送数据
            websocket.send(JSON.stringify(message));
            $('.msg').append('<div class="to txt">'+$('#text').val()+'</div>');
            $('#text').val('');

        }
        else if(!$('#text').val() && $('#img').val()){
            var file = $('#img')[0].files[0];
            if(!/image\/\w+/.test(file.type)){
                layer.msg('图片?ok?');
                return;
            }
            var reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = function(e){                
                message.data = this.result;
                message.type = 'image';
                message.from = user.nickname;
                message.to = $('input:radio[name="user"]:checked').val();
                message.time = (new Date()).getTime();
                //向服务器发送数据
                websocket.send(JSON.stringify(message));
                $('.msg').append('<div class="txt to"><img  class="img" src="'+this.result+'" alt=""/></div>');
                $('#img').val('');
                $(".img_preview").empty();
            };
        } else{
            layer.msg('只支持一次发送消息或者图片！');
            $('#text').val('');
            return;
        }
        $('.msg').scrollTop( $('.msg')[0].scrollHeight );
    });
    $("#img_button").click(function(){
        $('input:file').click();
    });
    //回车事件

    $(document).keyup(function(e){
        if(e.which == 13){
            $('.send_button').click();
        }
    })
    $("#img").on("change",function(){
       var objUrl = getObjectURL(this.files[0]) ;  //获取图片的路径，该路径不是图片在本地的路径
       if (objUrl) {
         $(".img_preview").html('<img class="img" src="'+objUrl+'"/>');      //将图片路径存入src中，显示出图片
       }
    });
 
    //建立一個可存取到該file的url
    function getObjectURL(file) {
          var url = null ;
          if (window.createObjectURL!==undefined) { // basic
            url = window.createObjectURL(file) ;
          } else if (window.URL!==undefined) { // mozilla(firefox)
            url = window.URL.createObjectURL(file) ;
          } else if (window.webkitURL!==undefined) { // webkit or chrome
            url = window.webkitURL.createObjectURL(file) ;
          }
          return url ;
        }

});