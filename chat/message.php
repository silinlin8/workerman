<?php
class Message{
	public $msg = array('type'=>'','data'=>'','from'=>'','to'=>'');

	public function getUsers($worker){ //客户端连接时获得用户信息
		$this->msg = array('type'=>'','data'=>'','from'=>'','to'=>'');
		foreach($worker->fd as $key=>$value){
			$this->msg['data'] .= $key.'-'.$value['status'].','; //username-1 在线
		}
		$this->msg['type'] = 'users';
		return json_encode($this->msg);
	}
	
	public function sendUsers($worker,$connection){
		foreach($worker->fd as $key=>$value){
			if($value['connection'] != $connection && $value['status'] == 1){
				$value['connection']->send($this->getUsers($worker)); //向所有人推送用户信息 
			}
		}
	}

	public function sendToUser($arr,$worker,$connection){ //存储消息并向用户发送消息
		$text = urlencode(json_encode($arr));
		if($arr['to'] != 'ALL'){
				$worker->redis->lpush($arr['from'].'-'.$arr['to'],$text);
				$data = $worker->fd[$arr['to']]['connection']->send(urldecode($text))?'OK':'FAIL';
		}else{
				$worker->redis->lpush('ALL',$text);
				foreach($worker->fd as $key=>$value){
					if($value['connection'] != $connection && $value['status'] == 1)
						$value['connection']->send(urldecode($text)); //向所有人推送信息 
				}
				$data = 'OK';
		}
			//发送成功 发送失败标记
			 
		$this->msg['type'] = 'tag';
		$this->msg['data'] = $data;
		return json_encode($this->msg);
	}

	public function msg($arr,$connection,$worker){
		$this->msg = array('type'=>'','data'=>'','from'=>'','to'=>'');
		switch($arr['type']){
			case 'users': //上传用户信息
				$connection->id = $arr['data'];
				$worker->fd[$arr['data']] = array('connection'=>$connection,'status'=>1,'logtime'=>time());
				$worker->onlineuser++;
				$this->sendUsers($worker,$connection);
				return ;
				break;

			case 'record': //聊天记录
				if($arr['to'] != 'ALL'){
					if(is_string($arr['data'])){ //下拉刷新时获取
						$from_number = (int)(explode(',',$arr['data'])[0]);
						$to_number = (int)(explode(',',$arr['data'])[1]);
					}else{
						$from_number = $to_number = $arr['data'];
					}
					$a = $worker->redis->lrange($arr['from'].'-'.$arr['to'],$from_number,$from_number+30);
					$b = $worker->redis->lrange($arr['to'].'-'.$arr['from'],$to_number,$to_number+30);
					$c = array_merge($a,$b);
				}else{
					$c = $worker->redis->lrange('ALL',$arr['data'],$arr['data']+30);
				}
				$data = urldecode(json_encode($c));
				$this->msg['type'] = 'record';
				$this->msg['data'] = $data;
				return json_encode($this->msg);
				break;

			case 'text': //文本信息				
				return $this->sendToUser($arr,$worker,$connection);
				break;

			case 'image': //图片信息
				
				if($worker->onlineuser < 100){ //100人以下存图片到服务器
					$filePath = './static/image/';
					$imageBody = base64_decode(substr(strstr($arr['data'],','),1));
					$fileName = uniqid(md5(time())).'.'.(explode('/',explode(';',$arr['data'])[0])[1]);
					$file = $filePath.$fileName;
					if(file_put_contents($file,$imageBody)){
					 	$arr['data'] = $file;
						return $this->sendToUser($arr, $worker, $connection);
					}
				}
				else
					return $this->sendToUser($arr, $worker, $connection);
				break;

		}
	}

}