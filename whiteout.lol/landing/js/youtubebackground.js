if (typeof Object.create !== "function") {
    Object.create = function(obj) {
        function F() {}
        F.prototype = obj;
        return new F();
    };
}
(function($, window, document) {
    var
        loadAPI = function loadAPI(callback) {
            var tag = document.createElement('script'),
                head = document.getElementsByTagName('head')[0];
            if (window.location.origin == 'file://') {
                tag.src = 'http://www.youtube.com/iframe_api';
            } else {
                tag.src = '//www.youtube.com/iframe_api';
            }
            head.appendChild(tag);
            head = null;
            tag = null;
            iframeIsReady(callback);
        },
        iframeIsReady = function iframeIsReady(callback) {
            if (typeof YT === 'undefined' && typeof window.loadingPlayer === 'undefined') {
                window.loadingPlayer = true;
                window.dfd = $.Deferred();
                window.onYouTubeIframeAPIReady = function() {
                    window.onYouTubeIframeAPIReady = null;
                    window.dfd.resolve("done");
                    callback();
                };
            } else if (typeof YT === 'object') {
                callback();
            } else {
                window.dfd.done(function(name) {
                    callback();
                });
            }
        };
    YTPlayer = {
        player: null,
        defaults: {
            ratio: 16 / 9,
            videoId: 'LSmgKRx5pBo',
            mute: true,
            repeat: true,
            width: $(window).width(),
            playButtonClass: 'YTPlayer-play',
            pauseButtonClass: 'YTPlayer-pause',
            muteButtonClass: 'YTPlayer-mute',
            volumeUpClass: 'YTPlayer-volume-up',
            volumeDownClass: 'YTPlayer-volume-down',
            start: 0,
            pauseOnScroll: false,
            fitToBackground: true,
            playerVars: {
                iv_load_policy: 3,
                modestbranding: 1,
                autoplay: 1,
                controls: 0,
                showinfo: 0,
                wmode: 'opaque',
                branding: 0,
                autohide: 0
            },
            events: null
        },
        init: function init(node, userOptions) {
            var self = this;
            self.userOptions = userOptions;
            self.$body = $('body'), self.$node = $(node), self.$window = $(window);
            self.defaults.events = {
                'onReady': function(e) {
                    self.onPlayerReady(e);
                    if (self.options.pauseOnScroll) {
                        self.pauseOnScroll();
                    }
                    if (typeof self.options.callback == 'function') {
                        self.options.callback.call(this);
                    }
                },
                'onStateChange': function(e) {
                    if (e.data === 1) {
                        self.$node.find('img').fadeOut(400);
                        self.$node.addClass('loaded');
                    } else if (e.data === 0 && self.options.repeat) {
                        self.player.seekTo(self.options.start);
                    }
                }
            }
            self.options = $.extend(true, {}, self.defaults, self.userOptions);
            self.options.height = Math.ceil(self.options.width / self.options.ratio);
            self.ID = (new Date()).getTime();
            self.holderID = 'YTPlayer-ID-' + self.ID;
            if (self.options.fitToBackground) {
                self.createBackgroundVideo();
            } else {
                self.createContainerVideo();
            }
            self.$window.on('resize.YTplayer' + self.ID, function() {
                self.resize(self);
            });
            loadAPI(self.onYouTubeIframeAPIReady.bind(self));
            self.resize(self);
            return self;
        },
        pauseOnScroll: function pauseOnScroll() {
            var self = this;
            self.$window.on('scroll.YTplayer' + self.ID, function() {
                var state = self.player.getPlayerState();
                if (state === 1) {
                    self.player.pauseVideo();
                }
            });
            self.$window.scrollStopped(function() {
                var state = self.player.getPlayerState();
                if (state === 2) {
                    self.player.playVideo();
                }
            });
        },
        createContainerVideo: function createContainerVideo() {
            var self = this;
            var $YTPlayerString = $('<div id="ytplayer-container' + self.ID + '" >\
                                    <div id="' + self.holderID + '" class="ytplayer-player-inline"></div> \
                                    </div> \
                                    <div id="ytplayer-shield" class="ytplayer-shield"></div>');
            self.$node.append($YTPlayerString);
            self.$YTPlayerString = $YTPlayerString;
            $YTPlayerString = null;
        },
        createBackgroundVideo: function createBackgroundVideo() {
            var self = this,
                $YTPlayerString = $('<div id="ytplayer-container' + self.ID + '" class="ytplayer-container background">\
                                    <div id="' + self.holderID + '" class="ytplayer-player"></div>\
                                    </div>\
                                    <div id="ytplayer-shield" class="ytplayer-shield"></div>');
            self.$node.append($YTPlayerString);
            self.$YTPlayerString = $YTPlayerString;
            $YTPlayerString = null;
        },
        resize: function resize(self) {
            var container = $(window);
            if (!self.options.fitToBackground) {
                container = self.$node;
            }
            var width = container.width(),
                pWidth, height = container.height(),
                pHeight, $YTPlayerPlayer = $('#' + self.holderID);
            if (width / self.options.ratio < height) {
                pWidth = Math.ceil(height * self.options.ratio);
                $YTPlayerPlayer.width(pWidth).height(height).css({
                    left: (width - pWidth) / 2,
                    top: 0
                });
            } else {
                pHeight = Math.ceil(width / self.options.ratio);
                $YTPlayerPlayer.width(width).height(pHeight).css({
                    left: 0,
                    top: (height - pHeight) / 2
                });
            }
            $YTPlayerPlayer = null;
            container = null;
        },
        onYouTubeIframeAPIReady: function onYouTubeIframeAPIReady() {
            var self = this;
            self.player = new window.YT.Player(self.holderID, self.options);
        },
        onPlayerReady: function onPlayerReady(e) {
            if (this.options.mute) {
                e.target.mute();
            }
            e.target.playVideo();
        },
        getPlayer: function getPlayer() {
            return this.player;
        },
        destroy: function destroy() {
            var self = this;
            self.$node.removeData('yt-init').removeData('ytPlayer').removeClass('loaded');
            self.$YTPlayerString.remove();
            $(window).off('resize.YTplayer' + self.ID);
            $(window).off('scroll.YTplayer' + self.ID);
            self.$body = null;
            self.$node = null;
            self.$YTPlayerString = null;
            self.player.destroy();
            self.player = null;
        }
    };
    $.fn.scrollStopped = function(callback) {
        var $this = $(this),
            self = this;
        $this.scroll(function() {
            if ($this.data('scrollTimeout')) {
                clearTimeout($this.data('scrollTimeout'));
            }
            $this.data('scrollTimeout', setTimeout(callback, 250, self));
        });
    };
    $.fn.YTPlayer = function(options) {
        return this.each(function() {
            var el = this;
            $(el).data("yt-init", true);
            var player = Object.create(YTPlayer);
            player.init(el, options);
            $.data(el, "ytPlayer", player);
        });
    };
})(jQuery, window, document);