define([], function() {
	
	Sandbox = {
		stripNotNice: function(html) 
		{
			// remove the <html> tag
			html = html.replace(/[\s\S]*<\s*html[\s>]+[\s\S]*?>/gi, "");

			// try to remove the head block
			html = html.replace(/[\s\S]*<\s*\/head[\s>]+[\s\S]*?>/gi, "");
			
			// remove scripting if possible
			html = html.replace(/<\s*script[\s>]+[\s\S]*?<\s\/script\[\s\S]*?>/gi,"");
			
			// remove before the body
			html = html.replace(/[\s\S]*<\s*body>/gi,"<div>");
			html = html.replace(/[\s\S]*<\s*body\s/gi,"<div ");
			
			// remove after the body
			html = html.replace(/<\s*\/body[\s>]+[\s\S]*/gi,"</div>");
			
			// remove the html tag ender and everything aftewards
			html = html.replace(/<\s*\/html[\s>]+[\s\S]*/gi,"");

			return html;
		},
			
		balance: function(html)
		{
			return $('<div/>').html(html).html();
		},
			
		strip: function (html) {
			return this.balance(this.stripNotNice(html));
		},
	};
	
});