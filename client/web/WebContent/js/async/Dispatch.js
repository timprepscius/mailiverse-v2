define ([
  'support',
        
 ], function() {

Dispatch = {
		
	log: function()
	{
		console.log.apply(console, arguments);
	},
	
	mode: 'async',
	
	onCalculateEventEnd : null,
	onCalculateEventBegin : null,
	asyncCallbacks: {},
	asyncCallbackId: 0,
	numAsyncCalculations:0,

	handleResponse: function(data)
	{
		this.numAsyncCalculations--;
		if (window.onCalculateEventEnd)
			window.onCalculateEventEnd(this.numAsyncCalculations);
		
		var callbacks = this.asyncCallbacks[data.callback];
		delete this.asyncCallbacks[data.callback];

		this.log("onmessage ",data.callback,data.original.cmd);
		
		if (data.exception)
		{
			if (callbacks.failure)
			{
				callbacks.failure(data.exception);
			}
			else
				throw data.exception;
		}
		else
		{
			if (callbacks.success)
			{
				callbacks.success(data.result);
			}
			else
			{
				throw data.result;
			}
		}
	},
	
	onWorkerResponse: function(message)
	{
		var data = message.data;
		if (data.original.cmd == 'ping')
		{
			if (this.mode != 'native')
			{
				this.log("ping received switching to worker mode");
				this.mode = 'worker';
			}
		}
		else
		{
			this.handleResponse(data);
		}
	},

	dispatch: function(cmd, a, force)
	{
		this.numAsyncCalculations++;
		if (window.onCalculateEventBegin)
			window.onCalculateEventBegin(this.numAsyncCalculations);

		var callback = a[0];
		var args = Array.prototype.slice.call(a,1);
		force = (force == undefined) ? false : force;

		var mode = this.mode;
		
		if (mode == 'sync')
		{
			try
			{
				this.log("sync",cmd);
				var result = Support[cmd].apply(null, args);
				this.log("onsync ",result);
				
				if (callback.success)
					callback.success(result);
				else
					throw result;
			}
			catch (exception)
			{
				if (cmd != 'ping')
				{
					if (callback.failure)
						callback.failure(exception);
					else
						throw exception;
				}
			}
			
			this.numAsyncCalculations--;
			if (window.onCalculateEventEnd)
				window.onCalculateEventEnd(this.numAsyncCalculations);
		}
		else
		if (mode == 'async')
		{
			var that = this;
			var callbackId = this.asyncCallbackId++;
			this.asyncCallbacks[callbackId] = callback;

			setTimeout(
				function() {
					var request = {cmd:cmd, args:args, callback:callbackId};
					var response = {original:request, callback:callbackId};
					
					try
					{
						response.result = Support[cmd].apply(null,args);
					}
					catch (exception)
					{
						response.exception = exception;
					}
					
					that.handleResponse(response);
				},
				0
			);
		}
		else
		if (mode == 'worker')
		{
			var callbackId = this.asyncCallbackId++;
			this.asyncCallbacks[callbackId] = callback;
		
			this.log("worker ",callbackId, cmd);
			this.worker.postMessage({cmd:cmd, args:args, callback:callbackId});
		}
		else
		if (mode == 'native')
		{
			var callbackId = this.asyncCallbackId++;
			this.asyncCallbacks[callbackId] = callback;
		
			this.log("native",callbackId, cmd);
			mNative.sendRequest({cmd:cmd, args:args, callback:callbackId});		
		}
	},
	
	startWorker: function()
	{
		return;
		
		if (this.mode != 'native')
		{
			var that = this;
			this.log("starting worker");
			
			this.mode = 'worker';
			this.worker = new Worker(VERSION + '/js/async/Worker.js');
			this.worker.onmessage = function(message) { that.onWorkerResponse.apply(that, arguments); };
			this.worker.postMessage({cmd:'ping', args:[], callback:-1});
		}
	},
	
	startNative: function()
	{
		if (this.mode == 'worker')
		{
			this.worker.postMessage({cmd:'shutdown'});
		}
		
		var that = this;
		this.mode = 'native';
		mNative.onResponse = function() { that.handleResponse.apply(that, arguments); };
		mNative.sendRequest({cmd:'cout',args:["starting native"], callback:-1});
	},
};

});
