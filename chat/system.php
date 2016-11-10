<?php
//系统处理类
class System
{
	//删除长时间不在线用户及聊天记录
	public function deleteUser($worker){
		$time = time();
		foreach($worker->fd as $key=>$value){
			if(!$value['status'] && $time-$value['logtime']>2*24*3600){
				unset($worker->fd[$key]);
				foreach($worker->fd as $m=>$n){	

					$worker->redis->del($key.'-'.$m);
					$worker->redis->del($m.'-'.$key);
				}
			}
		}
		$worker->redis->ltrim('ALL',0,2000);//保存群聊的聊天记录2000条

	}
}