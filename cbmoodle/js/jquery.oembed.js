﻿(function($) {
    $.fn.oembed = function(url, options, callback) {

        options = $.extend(true, $.fn.oembed.defaults, options);

        return this.each(function() {

            var container = $(this),
				resourceURL = (url != null) ? url : container.attr("href"),
				provider;

            if (!callback) callback = function(container, oembed) {			
				 $.fn.oembed.insertCode(container, options.embedMethod, oembed);
            };

            if (resourceURL != null) {
                provider = getOEmbedProvider(resourceURL);

                if (provider != null) {
                    provider.maxWidth = options.maxWidth;
                    provider.maxHeight = options.maxHeight;					
					provider.params = options[provider.name] || {};
                    provider.embedCode(container, resourceURL, callback);
                    return;
                }
            }

            callback(container, null);
        });
    };

    // Plugin defaults
    $.fn.oembed.defaults = {
        maxWidth: null,
        maxHeight: null,
		embedMethod: "replace" // "auto", "append", "fill"
    };
	
	$.fn.oembed.insertCode = function(container, embedMethod, oembed) {
		switch(embedMethod)
		{
			case "auto":				
                if (container.attr("href") != null) {
					insertCode(container, "append", oembed);
				}
				else {
					insertCode(container, "replace", oembed);
				};
				break;
			case "replace":	
				container.replaceWith(oembed.code);
				break;
			case "fill":
				container.html(oembed.code);
				break;
			case "append":
                var oembedContainer = container.next();
				if (oembedContainer == null || !oembedContainer.hasClass("oembed-container")) {
					oembedContainer = container
						.after('<div class="oembed-container"></div>')
						.next(".oembed-container");
					if (oembed != null && oembed.provider_name != null)
					    oembedContainer.toggleClass("oembed-container-" + oembed.provider_name);		
				}
				oembedContainer.html(oembed.code);				
				break;			
		}
	}	

    $.fn.oembed.getPhotoCode = function(url, data) {
	    var alt = data.title ? data.title : '';
        alt += data.author_name ? ' - ' + data.author_name : '';
        alt += data.provider_name ? ' - ' +data.provider_name : '';
        var code = '<div><a href="' + url + '" target="_blank"><img src="' + data.url + '" alt="' + alt + '"/></a></div>';
        if (data.html)
            code += "<div>" + data.html + "</div>";
        return code;
    };

    $.fn.oembed.getVideoCode = function(url, data) {
        var code = data.html;
        return code;
    };

    $.fn.oembed.getRichCode = function(url, data) {
        var code = data.html;
        return code;
    };

    $.fn.oembed.getGenericCode = function(url, data) {
        var title = (data.title != null) ? data.title : url,
			code = '<a href="' + url + '">' + title + '</a>';
        if (data.html)
            code += "<div>" + data.html + "</div>";
        return code;
    };

    $.fn.oembed.isAvailable = function(url) {
        var provider = getOEmbedProvider(url);
        return (provider != null);
    };

    /* Private Methods */
    function getOEmbedProvider(url) {
        for (var i = 0; i < providers.length; i++) {
            if (providers[i].matches(url))
                return providers[i];
        }
        return null;
    }

    var providers = [
        new OEmbedProvider("fivemin", "5min.com"),
        new OEmbedProvider("amazon", "amazon.com"),
        new OEmbedProvider("flickr", "flickr", "http://flickr.com/services/oembed", "jsoncallback"),    
        new OEmbedProvider("googlevideo", "video.google."),
        new OEmbedProvider("hulu", "hulu.com"),
        new OEmbedProvider("imdb", "imdb.com"),
        new OEmbedProvider("metacafe", "metacafe.com"),
        new OEmbedProvider("qik", "qik.com"),
        new OEmbedProvider("revision3", "slideshare"),
        new OEmbedProvider("slideshare", "5min.com"),
        new OEmbedProvider("twitpic", "twitpic.com"),
        new OEmbedProvider("viddler", "viddler.com"),
        new OEmbedProvider("vimeo", "vimeo.com", "http://vimeo.com/api/oembed.json"),
        new OEmbedProvider("wikipedia", "wikipedia.org"),
        new OEmbedProvider("wordpress", "wordpress.com"),
        new OEmbedProvider("youtube", "youtube.com"),
		        new OEmbedProvider("moodurian", "moodurian.com"),
				        new OEmbedProvider("themalaysianinsider", "themalaysianinsider.com"),
						        new OEmbedProvider("cnn", "cnn.com"),
		
    ];

    function OEmbedProvider(name, urlPattern, oEmbedUrl, callbackparameter) {
        this.name = name;
        this.urlPattern = urlPattern;
        this.oEmbedUrl = (oEmbedUrl != null) ? oEmbedUrl : "http://oohembed.com/oohembed/";
        this.callbackparameter = (callbackparameter != null) ? callbackparameter : "callback";
        this.maxWidth = 200;
        this.maxHeight = 100;

        this.matches = function(externalUrl) {
            // TODO: Convert to Regex
            return externalUrl.indexOf(this.urlPattern) >= 0;
        };

        this.getRequestUrl = function(externalUrl) {

            var url = this.oEmbedUrl;

            if (url.indexOf("?") <= 0)
                url = url + "?";

			var qs = "";

			for (var i in this.params) {
                // We don't want them to jack everything up by changing the callback parameter
                if (i == this.callbackparameter)
                  continue;
                
				// allows the options to be set to null, don't send null values to the server as parameters
                if (this.params[i] != null)
                	qs += "&" + escape(i) + "=" + this.params[i];
            }			

            url += "format=json";
			
			if (this.maxWidth != null)
				url += "&maxwidth=" + this.maxWidth;
				
			if (this.maxHeight != null)
				url += "&maxheight=" + this.maxHeight;			
				
			url += "&url=" + escape(externalUrl) + 			
					qs + 
					"&" + this.callbackparameter + "=?";
					
            return url;
        }

        this.embedCode = function(container, externalUrl, callback) {

            var request = this.getRequestUrl(externalUrl);

            $.getJSON(request, function(data) {

                var oembed = $.extend(data);

                var code, type = data.type;

                switch (type) {
                    case "photo":
                        oembed.code = $.fn.oembed.getPhotoCode(externalUrl, data);
                        break;
                    case "video":
                        oembed.code = $.fn.oembed.getVideoCode(externalUrl, data);
                        break;
                    case "rich":
                        oembed.code = $.fn.oembed.getRichCode(externalUrl, data);
                        break;
                    default:
                        oembed.code = $.fn.oembed.getGenericCode(externalUrl, data);
                        break;
                }

                callback(container, oembed);
            });
        }
    }
})(jQuery);