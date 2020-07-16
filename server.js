
const express = require('express');
const app = express();

const bodyParser = require('body-parser');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex');


const db = knex({
		client: 'pg',
		connection: {
		 connectionString: process.env.DATABASE_URL,
  			ssl: true,
		}
});

/*

const db = knex({
		client: 'pg',
		connection: {
		host: '127.0.0.1',
		user: 'postgres',
		password: 'abc123',
		database: 'NBA_DTF'
	}
});
*/

//const PORT = 3000

/*
db.select('*').from('players').then(data =>{
	console.log(data);
})
*/
app.use(bodyParser.json());
app.use(cors());


/*
const database = {
	users:[
		{
			id: '123',
			name: 'john',
			email: 'john@gmail.com',
			password: 'cookies',
			entries: 0,
			joined: new Date()
		}
	]
}

app.get('/',(req,res) =>{
	 res.send(database.users);
})

*/

/*
app.post('/signin', (req,res) =>{
	db.select('email','password').from('login')
	  .where('email', '=', req.body.email)
	  .then( data =>{
	  	const isValid = bcrypt.compareSync(req.body.password, data[0].password);
	  	const isValid = bcrypt.compareSync(req.body.password, data[0].password);
	  })

})
*/

/*
app.get('/standings',(req,res) =>{
	 db.select('*').from('standings').orderBy('total_pra', 'desc')
	   .then(players => {
	   	

	   		if(players.length) {
	   				
	   			res.json(players);
	   		}else{
	   			console.log('Standings table has no data');
	   			res.json(players);
	   		}

	   })
	   .catch( err => res.status(400).json('Error getting standings'))
*/

app.get('/standings',(req,res) =>{
db.raw('select rownum,user_id,name,total_pra,current_pra,last_pick from ( select rank () over ( order by total_pra desc) as rownum ,a.* from(select user_id,name,total_pra,current_pra,last_pick from standings )  a) b')
	 	.then(data => {	   	
		//res.json('length' + res.json(data.rows));
	   		if(data.rows.length) {
	   			
	 			res.json(data.rows);
	   		}else{
	   			console.log('Standings table has no data');
				res.json('Standings table has no data');	   		}

	   })
	   .catch( err => res.status(400).json('Error getting standings'))


	
	 //console.log('standings called');
})

app.get('/gamedates',(req,res) =>{
db.raw(' select  table_id,to_char(game_date,\'MM/DD/YYYY\') as game_date,game_done from game_dates order by game_date')
	 	.then(data => {	   	
		//res.json('length' + res.json(data.rows));
	   		if(data.rows.length) {
	   			
	 			res.json(data.rows);
	   		}else{
	   			console.log('gamedates table has no data');
				res.json('gamedates table has no data');	   		}

	   })
	   .catch( err => res.status(400).json('Error getting game_dates'))


	
	 //console.log('standings called');
})


// N - No picks yet
// E - Error getting players

app.put('/loadpickedplayers',(req,res) =>{
	 const { user_id } = req.body;
	 db.raw('select to_char(ph.game_date,\'mm-dd Day\')  as game_date ,case when trim(ph.team_name) is null then \'-\' else ph.team_name end ,ph.player_name , case when ph.player_name  = \'No Pick\' then 0 else gsd.total_pra  end , case when ph.player_name  = \'No Pick\' then 0 else gsd.points  end , case when ph.player_name  = \'No Pick\' then 0 else gsd.rebounds end , case when ph.player_name  = \'No Pick\' then 0 else gsd.assists end from picks ph left join game_schedule_details gsd on  date_trunc( \'day\',ph.game_date) = gsd.game_date and ph.player_id = gsd.player_id where ph.user_id = ? and ph.game_done  =\'Y\' ', [user_id] )
	   .then(players => {
	   		console.log(players.rows)


	   	if(players.rows.length){
	   		res.json(players.rows)
	   	}
	   	else
	   	{
	   		res.status(400).json('N')
	   	}
	   })
	   .catch( err => res.status(400).json('E'))

	
})


app.put('/loadplayers',(req,res) =>{
	 const { game_date,user_id } = req.body;
	db.raw('select to_char(gs.game_date,\'mm/dd/yyyy hh24:mi:ss\') as game_date,p.*  from game_schedule gs  join players p  on  (p.team_id = gs.home_id  or p.team_id = gs.away_id )  and date_trunc(\'day\',game_date) = to_date( ?,\'mm/dd/yyyy\')  and game_date  > now() and (player_id) not in ( select player_id from picks where user_id = ?) order by team_id ,player_id ', [game_date,user_id] )
//db.raw('select p.*  from game_schedule gs  join players p  on  (p.team_id = gs.home_id  or p.team_id = gs.away_id )   and (player_id) not in ( select player_id from picks where user_id = ?) order by team_id ,player_id ', [user_id] )
	  .then(players => {
	   		console.log(players.rows)


	   	if(players.rows.length){
	   		res.json(players.rows)
	   	}
	   	else
	   	{
	   		res.status(400).json('Not found')
	   	}
	   })
	   .catch( err => res.status(400).json('Error getting players'))

	
})


app.put('/loadteam',(req,res) =>{
	 const { game_date } = req.body;
	//db.raw('select team_id, home as team_name from ( select home_id as team_id,home   from game_schedule gs where date_trunc(\'day\',game_date)  = to_date( to_char( ?,\'mm/dd/yyyy hh24:mi:ss\' ),\'mm/dd/yyyy\') union all  select away_id as id,away from game_schedule gs where date_trunc(\'day\',game_date)  = to_date( to_char( ?,\'mm/dd/yyyy hh24:mi:ss\' ),\'mm/dd/yyyy\'))a ', [game_date,game_date] )
//	db.raw('select team_id, home as team_name from ( select home_id as team_id,home   from game_schedule gs where date_trunc(\'day\',game_date)  = to_date( ?,\'mm/dd/yyyy\') and  game_date   > \'5/27/2020 01:45:00\'  union all  select away_id as id,away from game_schedule gs where date_trunc(\'day\',game_date)  = to_date( ?,\'mm/dd/yyyy\') and  game_date   > \'5/27/2020 01:45:00\'  )a ', [game_date,game_date] )
	db.raw('select team_id, home as team_name from ( select home_id as team_id,home   from game_schedule gs where date_trunc(\'day\',game_date)  = to_date( ?,\'mm/dd/yyyy\') and  game_date   >  now() union all  select away_id as id,away from game_schedule gs where date_trunc(\'day\',game_date)  = to_date( ?,\'mm/dd/yyyy\') and  game_date   >  now()  )a ', [game_date,game_date] )
//ok no sysdate checking	db.raw('select team_id, home as team_name from ( select home_id as team_id,home   from game_schedule gs where date_trunc(\'day\',game_date)  = to_date( ?,\'mm/dd/yyyy\')    union all  select away_id as id,away from game_schedule gs where date_trunc(\'day\',game_date)  = to_date( ?,\'mm/dd/yyyy\')   )a ', [game_date,game_date] )
	  .then(players => {
	   		console.log(players.rows)


	   	if(players.rows.length){
	   		res.json(players.rows)
	   	}
	   	else
	   	{
	   		res.status(400).json('')
	   	}
	   })
	   .catch( err => res.status(400).json('Error getting players'))

	
})


app.put('/schedule',(req,res) =>{
	 const { game_date } = req.body;
	//db.raw('select to_char(game_date,\'mm/dd/yyyy hh24:mi:ss\') as game_date ,game_id,game_name from game_schedule gs where game_done  =\'N\' and date_trunc( \'day\', game_date)  =  to_date(?,\'mm/dd/yyyy\') and game_date   > \'5/27/2020 01:45:00\'', [game_date] )
		db.raw('select to_char(game_date,\'mm/dd/yyyy hh24:mi:ss\') as game_date ,game_id,game_name from game_schedule gs where game_done  =\'N\' and date_trunc( \'day\', game_date)  =  to_date(?,\'mm/dd/yyyy\') and game_date   >  now()', [game_date] )
	  .then(players => {
	   		console.log(players.rows)


	   	if(players.rows.length){
	   		res.json(players.rows)
	   	}
	   	else
	   	{
	   		res.status(400).json('')
	   	}
	   })
	   .catch( err => res.status(400).json('Error getting players'))

	
})


app.put('/loadperteam',(req,res) =>{
	 const { team_id,game_date } = req.body;
	db.raw('select p.* from game_schedule gs join players p on  (p.team_id = gs.home_id  or p.team_id  = gs.away_id) and p.team_id = ? and date_trunc(\'day\',game_date)  = ?', [team_id,game_date] )
	  .then(players => {
	   		console.log(players.rows)


	   	if(players.rows.length){
	   		res.json(players.rows)
	   	}
	   	else
	   	{
	   		res.status(400).json('Not found')
	   	}
	   })
	   .catch( err => res.status(400).json('Error getting players'))


})


app.put('/picks',(req,res) =>{
	 const { game_date,user_id } = req.body;
//	db.raw('select gd.table_id , to_char(gd.game_date,\'mm/dd/yyyy\') as game_date,gd.game_done , a.user_id,a.player_id,a.player_name,a.photo from game_dates gd left join ( select  p.user_id,p.game_date, p.game_done ,p2.player_id,p2.player_name,p2.photo from  picks p  join players p2 on p.team_id = p2.team_id  and p.player_id  = p2.player_id  where  p.user_id = ?   ) a  on  a.game_date = gd.game_date  order by gd.game_date ', [user_id] )
	db.raw('select temp.table_id,case when gs.game_date is null or temp.game_done = \'Y\' then  to_char(to_timestamp(temp.game_date_only,\'mm/dd/yyyy\'),\'mm/dd/yyyy\') else  to_char(gs.game_date ,\'mm/dd/yyyy hh24:mi:ss\')  end as game_date ,temp.game_done,temp.user_id,temp.player_id,temp.team_id ,temp.player_name,temp.photo from ( select gd.table_id , to_char(gd.game_date,\'mm/dd/yyyy\') as game_date_only, gd.game_done , a.user_id,a.player_id,a.team_id,a.player_name,a.photo from game_dates gd left join ( select  p.user_id,p.game_date, p.game_done,p.team_id ,p2.player_id,p2.player_name ,p2.photo from  picks p  join players p2 on p.team_id = p2.team_id  and p.player_id  = p2.player_id  where  p.user_id = ?   ) a  on  date_trunc(\'day\',a.game_date) = gd.game_date  ) temp left join game_schedule gs on date_trunc(\'day\',gs.game_date ) = to_timestamp( temp.game_date_only,\'mm/dd/yyyy\' ) and (gs.home_id = temp.team_id or gs.away_id = temp.team_id) order by temp.table_id ', [user_id] )
	  .then(players => {
	   		console.log(players.rows)


	   	if(players.rows.length){
	   		res.json(players.rows)
	   	}
	   	else
	   	{
	   		res.status(400).json('')
	   	}
	   })
	   .catch( err => res.status(400).json('Error getting players'))

	})


app.put('/getpicks',(req,res) =>{
	 const { user_id,game_date } = req.body;
	db.raw('select p.player_id ,p.player_name , points,rebounds,assists,total_pra from  picks p join game_schedule_details  gsd on date_trunc(\'day\',p.game_date)  = gsd.game_date and p.player_id  = gsd.player_id where p.game_done = \'Y\' and user_id =? and date_trunc(\'day\',p.game_date)   = ? ' , [user_id,game_date] )
	  .then(players => {
	   		console.log(players.rows)


	   	if(players.rows.length){
	   		res.json(players.rows)
	   	}
	   	else
	   	{
	   		res.status(400).json('')
	   	}
	   })
	   .catch( err => res.status(400).json('Error getting players'))

	})

app.put('/loadschedule',(req,res) =>{
	 const { game_date } = req.body;
	db.raw(' select  substr( to_char(game_date,\'mm/dd/yyyy hh24:mi:ss\'),12,5 ) as game_date ,game_id, game_name , home_id , home , home_score ,away_id, away,away_score,game_done from game_schedule gs where game_done = \'N\' and date_trunc(\'day\',game_date)  = to_date(?,\'mm/dd/yyyy\') order by game_date ', [game_date]  )
	  .then(schedule => {
	   		


	   	if(schedule.rows.length){
	   		res.json(schedule.rows)
	   	}
	   	else
	   	{
	   		res.status(400).json('')
	   	}
	   })
	   .catch( err => res.status(400).json('Error getting players'))

	})


app.put('/results',(req,res) =>{
	 const { game_date } = req.body;
	db.raw('select game_date,game_name,home,home_score,away,away_score from game_schedule gs where date_trunc(\'day\',game_date)  = ? and game_done = \'Y\' ', [game_date]  )
	  .then(schedule => {
	   		


	   	if(schedule.rows.length){
	   		res.json(schedule.rows)
	   	}
	   	else
	   	{
	   		res.status(400).json('')
	   	}
	   })
	   .catch( err => res.status(400).json('Error getting players'))

	})


app.put('/toppicks',(req,res) =>{
	 const { game_date } = req.body;
	db.raw('select player_name,points,rebounds,assists,total_pra from game_schedule_details gsd where date_trunc(\'day\',game_date)  = ? order by total_pra desc fetch first 3 rows  only', [game_date] )
	  .then(toppicks => {
	   		

	   	if(toppicks.rows.length){
	   		res.json(toppicks.rows)
	   	}
	   	else
	   	{
	   		res.status(400).json('')
	   	}
	   })
	   .catch( err => res.status(400).json('Error getting players'))

	})


// X - wrong username and password
// Z - account not found or approved

app.post('/signin', (req,res) =>{
	const { email, password} =  req.body;
	
	
	db.select('email','password').from('login')
	  .where('email','=',email)
	  .andWhere('approved','=','Y')
	  .then(data => {
	  		const isValid = bcrypt.compareSync(password,data[0].password);
	  
	  	
	  if(isValid){

	  	return db.select('*').from('users')
	  			.where('email','=',email)
	  			.then(user =>{
	  				res.json(user[0])
	  			})
	  			.catch(err => res.status(400).json('Unable to login'))
	  }	
	  else{
	  	res.status(400).json('X')
	  }
	})
	  .catch(err => res.status(400).json('Z'))

})


// app.post('/signin', (req,res) =>{

// 	const isValid = bcrypt.compareSync(req.body.password)
// 	db('login')
// 	  .count('* as cnt')
// 	  .where({
// 	  		email: req.body.email,
// 	  		password: req.body.password,
// 	  		approved: 'Y'
// 	  		})	  
// 	  .then( user => {

// 	  	//const aCount = res.json(user[0]);
// 	  	const aCount = (user[0].cnt);
// 	  	if(aCount > 0){
// 	  		//res.json('success');

// 	  		 db.select('user_id','name').from('users').where({email: req.body.email})
// 	  		 .then(name =>{
// 	  		 		res.json(name[0])
// 	  		 })
// 	  		// catch(err => res.status(400).json('No name on users table.'))


//  	  	}
//  	  	else{
//  	  		res.json('');
//  	  	}
//  	  })
//  	  .catch(err => res.status(400).json('Unable to signin.'))

//  })


// Y - User Registered
// N - Error on Registration
// E - Email already used
app.post('/register',(req,res) =>{
	 const { name,email,password} = req.body;
	 // bcrypt.hash(password,null,null,function(err,hash){
	 // 	console.log(hash);
	 // });

	 db('login')
	  .count('* as cnt')
	  .where({
	  		email: email
	  		})	  
	  .then( user => {

	  	//const aCount = res.json(user[0]);
	  	const aCount = (user[0].cnt);
	  	if(aCount > 0){
			res.json('E');
 	  	}
 	  	else{
		 	  		
 	  		const hash = bcrypt.hashSync(password);
			db.raw('insert into login (email,password) values (?,?)',[email,hash])
			 	.then(db.commit)
			db.raw('insert into users (email,name,password) values (?,?,?)',[email,name,hash])
				.then(db.commit)

				 .then(res.json('Y'))

			.catch(err => res.status(400).json('N'))


 	  	}
 	  })
 	  .catch(err => res.status(400).json('N'))

	 

})




// app.post('/register',(req,res) =>{
// 	 const { name,email,password} = req.body;
// 	 /*bcrypt.hash(password,null,null,function(err,hash){
// 	 	console.log(hash);
// 	 });
// 	 */
// 	 const hash = bcrypt.hashSync(password);
// 	db('users')
// 		.returning('*')
// 		.insert({
// 		name: name,
// 		email: email,
// 		password: hash
// 	}).then(user =>{
// 		res.json(user[0]);
// 	})
// 	.catch(err => res.status(400).json('Unable to Register.'))

// })

app.post('/insertpick',(req,res) =>{
	
	 const { user_id,team_id,team_name,player_id,player_name,game_date} = req.body;
console.log('test1 ' + game_date)
	 db.raw('select * from picks where date_trunc(\'day\',game_date)  = to_date(?,\'mm/dd/yyyy\') and user_id = ? and game_done= \'N\' ',[game_date,user_id])
	 	.then(picks => {
	   		

	   		if ( picks.rows.length  > 0 )  {
				console.log('test2 ' + game_date)

				db.raw('update picks set team_id = ? ,team_name = ? , player_id = ? , player_name= ? , game_date = ? where user_id= ? and  date_trunc(\'day\',game_date) = to_date( ?,\'mm/dd/yyyy\' )  ',[team_id,team_name,player_id,player_name,game_date,user_id,game_date])
				.then(picks.commit)
				 .then(res.json('Pick Updated'))
	 							
				 .catch(picks.rollback)
				
	   		}
	   		else{
			console.log('test3 ' + game_date)
	   			db.raw('insert into picks (user_id,team_id,team_name,player_id,player_name,pra,game_date,game_done) values (?,?,?,?,?,?,?,?) ',[user_id,team_id,team_name,player_id,player_name,0,game_date,'N'])
	   			.then(picks.commit)
				.then(res.json('Pick Inserted'))
	 			.then(user =>{
					res.json(user[0]);


				})
				
				.catch(picks.rollback)
				

	   		}
	   		

	   	})

	.catch(err => res.status(400).json('Unable to Pick.'))

})

app.get('/profile/:id',(req,res) =>{
	 const { id } = req.params;
	 db.select('*').from('users').where({id: id})
	   .then(user => {
	   		console.log(user)
	   	if(user.length){
	   		res.json(user[0])
	   	}
	   	else
	   	{
	   		res.status(400).json('Not found')
	   	}
	   })
	   .catch( err => res.status(400).json('Error getting user'))

	 if (!found){
	 	res.status(400).json('no such user');
	 }
	 
})




//app.listen(process.env.PORT || 3000, ()=>{
app.listen(3000, ()=>{
	//console.log('app is running at port 3000');
	console.log(`app is running at port 3000`);
});



/*

/ --> res=  this is working
/signin --> post = sucess or fail
/register --> post = user
/profile/:userid --> get = user
/pick --> put --> user's pick
*/

