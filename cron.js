/**
 * cron.js
 * ---
 * VERSION 0.1
 * ---
 * DON'T USE THIS -- IT'S NOT QUITE THERE YET!
 * ---
 * @author James Padolsey
 * ---
 * Dual licensed under the MIT and GPL licenses.
 *    - http://www.opensource.org/licenses/mit-license.php
 *    - http://www.gnu.org/copyleft/gpl.html
 
 usage :
    cron('* 1-17/2 * * *'), function(){ console.log("---")});
 */

var cron = function(){
	
	function CronJob(time, event) {
		
		this.source = time;
		this.second = {};
		this.minute = {};
		this.hour = {};
		this.dayOfMonth = {};
		this.month = {};
		this.dayOfWeek = {};
		this.events = [event];

		this._parse();
		
	};

	CronJob.prototype = {
		map : ['second', 'minute', 'hour', 'dayOfMonth', 'month', 'dayOfWeek'],
		constraints : [[0,59],[0,59],[0,23],[1,31],[0,11],[1,7]],
		aliases : {
			jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12,
			sun:0,mon:1,tue:2,wed:3,thu:4,fri:5,sat:6
		},

		addEvent: function(event) {
			this.events.push(event);
		},

		runEvents: function(now) {
			for (i in now) {
				if (!(now[i] in this[i])) {
					return;
				}
			}

			for (var i = -1, l = this.events.length; ++i < l; ) {
				if (typeof this.events[i] === 'function') {
					this.events[i]();
				}
			}
		},

		_parse: function() {
			
			var aliases = this.aliases,
			    source = this.source.replace(/[a-z]/i, function(alias){
			    	
			    	alias = alias.toLowerCase();
			    	
			    	if (alias in aliases) {
			    		return aliases[alias];
			    	}
			    	
			    	throw new Error('Unknown alias: ' + alias);
			    	
			    }),
			    split = this.source.replace(/^\s\s*|\s\s*$/g, '').split(/\s+/),
			    cur, len = 6;
			
			while (len--) {
				cur = split[len] || '*';
				this._parseField(cur, this.map[len], this.constraints[len]);
			}
			
		},
		_parseField: function(field, type, constraints) {
			
			var rangePattern = /(\d+?)(?:-(\d+?))?(?:\/(\d+?))?(?:,|$)/g,
			    typeObj = this[type],
			    diff,
			    low = constraints[0],
			    high = constraints[1];
			
			// * is a shortcut to [lower-upper] range
			field = field.replace(/\*/g,  low + '-' + high);

			if (field.match(rangePattern)) {
				
				field.replace(rangePattern, function($0, lower, upper, step) {

					step = step && parseInt(step) || 1;
					
					// Positive integer higher than constraints[0]
					lower = Math.max(low, ~~Math.abs(lower));
					
					// Positive integer lower than constraints[1]
					upper = upper ? Math.min(high, ~~Math.abs(upper)) : lower;

					diff =  step + upper - lower;

					while ((diff-=step) > -1) {
						typeObj[diff + lower] = true;
					}
					
				});
				
			} else {
				
				throw new Error('Field (' + field + ') cannot be parsed');
				
			}
			
		},
		equals: function(other) {
			var len = this.map.length;
			while (len--) {
				var field = this.map[len];
				for(var i in this[field]){
					if(this[field][i] != other[field][i])
						return false;
				}
			}
			return true;
		}
	};

	var time = {},
     	jobs = [],
	    timer;

	function tick(){
		var date = new Date();
 
		time.second = date.getSeconds();
		time.minute = date.getMinutes();
		time.hour = date.getHours();
		time.dayOfMonth = date.getDate();
		time.month = date.getMonth() + 1;
		time.dayOfWeek = date.getDay();

		for(var i = 0; i < jobs.length; i++){
			var job =  jobs[i];
			job.runEvents(time);
		}

		timer = timer || setInterval(tick, 1000);				
	} 

	function addJob(cronTime, event){
		var job = new CronJob(cronTime, event);
		for(var i=0; i < jobs.length; i++){
			var j =  jobs[i];
			if(j.equals(job)){
				j.addEvent(event);
				delete job;
				return;
			}
		}
		jobs.push(job);
	}

	var now = new Date();
	setTimeout(tick, Math.ceil(+now / 1000) * 1000 - +now);

	return addJob;
}();
