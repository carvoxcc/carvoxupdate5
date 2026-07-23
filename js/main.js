(function ($) {
    "use strict";

    // Spinner
    var spinner = function () {
        setTimeout(function () {
            if ($('#spinner').length > 0) {
                $('#spinner').removeClass('show');
            }
        }, 1);
    };
    spinner();


    // Initiate the wowjs
    new WOW().init();

    // Smart Image Caching, Single-Operation Touch Lock & RAM Management for Hero Carousel
    var headerCarouselEl = document.getElementById('header-carousel');
    if (headerCarouselEl) {
        var carouselItems = headerCarouselEl.querySelectorAll('.carousel-item');
        var totalItems = carouselItems.length;
        var navBtns = headerCarouselEl.querySelectorAll('.carousel-control-prev, .carousel-control-next');
        var slideWatchdogTimer = null;
        var headerCarousel = null;
        var isAnimating = false;
        var touchStartX = 0;
        var touchStartY = 0;
        var minSwipeThreshold = 40; // minimum px swipe distance

        // Function to preload a single slide image by swapping data-src to src
        function preloadSlideImage(index) {
            if (index < 0 || index >= totalItems) return;
            var item = carouselItems[index];
            if (item) {
                var img = item.querySelector('img[data-src]');
                if (img) {
                    var dataSrc = img.getAttribute('data-src');
                    if (dataSrc) {
                        img.src = dataSrc;
                        img.removeAttribute('data-src');
                    }
                }
            }
        }

        // Dynamically look 1 to 2 slides ahead (and behind for seamless navigation)
        function preloadUpcomingSlides(targetIndex) {
            var offsets = [0, 1, 2, -1, -2];
            for (var i = 0; i < offsets.length; i++) {
                var idx = (targetIndex + offsets[i] + totalItems) % totalItems;
                preloadSlideImage(idx);
            }
        }

        // Preload upcoming slides on initial page load (for active slide index 0)
        preloadUpcomingSlides(0);

        // Helper to enable/disable navigation controls & animation state
        function setControlsDisabled(disabled) {
            for (var i = 0; i < navBtns.length; i++) {
                navBtns[i].style.pointerEvents = disabled ? 'none' : 'auto';
            }
        }

        function lockInputState() {
            isAnimating = true;
            headerCarouselEl.classList.add('is-animating');
            setControlsDisabled(true);
        }

        function unlockInputState() {
            isAnimating = false;
            headerCarouselEl.classList.remove('is-animating');
            setControlsDisabled(false);
        }

        // Self-Healing Recovery Watchdog: Clear stuck transitional classes and reset animation lock
        function recoverStuckCarousel(targetIndex) {
            // 1. Forcibly remove all transitional CSS classes
            for (var i = 0; i < carouselItems.length; i++) {
                carouselItems[i].classList.remove(
                    'carousel-item-next',
                    'carousel-item-prev',
                    'carousel-item-start',
                    'carousel-item-end'
                );
            }

            // 2. Ensure target slide has .active class and others do not
            if (typeof targetIndex === 'number' && targetIndex >= 0 && targetIndex < totalItems) {
                for (var j = 0; j < carouselItems.length; j++) {
                    if (j === targetIndex) {
                        carouselItems[j].classList.add('active');
                    } else {
                        carouselItems[j].classList.remove('active');
                    }
                }
            }

            // 3. Clear animation lock and CSS input suppression
            unlockInputState();

            // 4. Re-initialize and kickstart carousel instance (touch: false) so it never stays frozen
            if (typeof bootstrap !== 'undefined') {
                var inst = bootstrap.Carousel.getInstance(headerCarouselEl);
                if (inst) {
                    inst.dispose();
                }
                headerCarousel = new bootstrap.Carousel(headerCarouselEl, {
                    interval: 3500,
                    wrap: true,
                    pause: false,
                    touch: false
                });
                headerCarousel.cycle();
            }
        }

        // Custom Strict Single-Gesture Touch Listener (touch: false on Bootstrap)
        headerCarouselEl.addEventListener('touchstart', function (e) {
            if (isAnimating || headerCarouselEl.classList.contains('is-animating')) {
                return;
            }
            if (e.touches && e.touches.length > 0) {
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
            }
        }, { passive: true });

        headerCarouselEl.addEventListener('touchend', function (e) {
            // STRICT TOUCH LOCK: If slide transition is running, IGNORE all touch swipes completely
            if (isAnimating || headerCarouselEl.classList.contains('is-animating')) {
                return;
            }
            if (e.changedTouches && e.changedTouches.length > 0) {
                var touchEndX = e.changedTouches[0].clientX;
                var touchEndY = e.changedTouches[0].clientY;
                var diffX = touchEndX - touchStartX;
                var diffY = touchEndY - touchStartY;

                // Check if horizontal swipe dominant and exceeds min threshold
                if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) >= minSwipeThreshold) {
                    if (diffX < 0) {
                        // Swipe Left -> Next slide
                        if (headerCarousel) headerCarousel.next();
                    } else {
                        // Swipe Right -> Prev slide
                        if (headerCarousel) headerCarousel.prev();
                    }
                }
            }
        }, { passive: true });

        // Listen to Bootstrap's slide.bs.carousel event (transition start)
        headerCarouselEl.addEventListener('slide.bs.carousel', function (e) {
            var targetIndex = typeof e.to !== 'undefined' ? e.to : 0;

            // 1. Strict Input Lock: Add .is-animating class and lock state
            lockInputState();

            // 2. Preload upcoming slides (2 slides ahead) into browser cache
            preloadUpcomingSlides(targetIndex);

            // 3. Auto-Recovery Watchdog: start 600ms timer to recover if mobile browser drops frame
            if (slideWatchdogTimer) {
                clearTimeout(slideWatchdogTimer);
            }
            slideWatchdogTimer = setTimeout(function () {
                recoverStuckCarousel(targetIndex);
            }, 600);
        });

        // Listen to Bootstrap's slid.bs.carousel event (transition complete)
        headerCarouselEl.addEventListener('slid.bs.carousel', function (e) {
            // Clear 600ms watchdog timer since transition completed cleanly
            if (slideWatchdogTimer) {
                clearTimeout(slideWatchdogTimer);
                slideWatchdogTimer = null;
            }

            // Unlock inputs and remove .is-animating CSS class
            unlockInputState();

            // Handle last slide infinite loop seamlessly
            if (typeof e.to !== 'undefined' && e.to === totalItems - 1) {
                setTimeout(function () {
                    if (headerCarousel) {
                        headerCarousel.to(0);
                        headerCarousel.cycle();
                    }
                }, 4500);
            }
        });

        // Initialize Carousel Autoplay instance with touch: false (custom swipe listener handles touch)
        if (typeof bootstrap !== 'undefined') {
            headerCarousel = bootstrap.Carousel.getInstance(headerCarouselEl) || new bootstrap.Carousel(headerCarouselEl, {
                interval: 3500,
                wrap: true,
                pause: false,
                touch: false
            });
            headerCarousel.cycle();
        }
    }


    // Auto-rotate Services Nav-Pills Tabs automatically (5-Second Interval)
    setInterval(function () {
        var serviceNav = document.querySelector('.service .nav-pills');
        if (!serviceNav) return;

        var tabButtons = Array.from(serviceNav.querySelectorAll('button[data-bs-toggle="pill"]'));
        if (tabButtons.length === 0) return;

        // Find currently active tab button index
        var activeIndex = tabButtons.findIndex(function (btn) {
            return btn.classList.contains('active');
        });

        // Determine next tab index
        var nextIndex = (activeIndex < 0) ? 0 : (activeIndex + 1) % tabButtons.length;
        var nextBtn = tabButtons[nextIndex];
        if (!nextBtn) return;

        // 1. Fire native click event
        nextBtn.click();

        // 2. Fire Bootstrap 5 Tab API if available
        if (typeof bootstrap !== 'undefined' && bootstrap.Tab) {
            try {
                var tab = bootstrap.Tab.getOrCreateInstance(nextBtn);
                if (tab) tab.show();
            } catch (e) { }
        }

        // 3. Fallback direct class manipulation (guarantees tab switch on all browsers)
        var targetId = nextBtn.getAttribute('data-bs-target');
        if (targetId) {
            tabButtons.forEach(function (btn) {
                btn.classList.remove('active');
                btn.setAttribute('aria-selected', 'false');
            });
            nextBtn.classList.add('active');
            nextBtn.setAttribute('aria-selected', 'true');

            var targetPane = document.querySelector(targetId);
            if (targetPane && targetPane.parentElement) {
                var panes = targetPane.parentElement.querySelectorAll('.tab-pane');
                panes.forEach(function (pane) {
                    pane.classList.remove('show', 'active');
                });
                targetPane.classList.add('show', 'active');
            }
        }
    }, 6000);


    // Sticky Navbar & Auto-close open mobile navbar list on scroll
    $(window).on('scroll touchmove', function () {
        if ($(this).scrollTop() > 300) {
            $('.sticky-top').css('top', '0px');
        } else {
            $('.sticky-top').css('top', '-100px');
        }

        // Auto-close open mobile navbar when scrolling/swiping the page
        if ($('.navbar-collapse').hasClass('show')) {
            $('.navbar-collapse').removeClass('show');
            $('.navbar-toggler').addClass('collapsed').attr('aria-expanded', 'false');
        }
    });

    // Auto-close mobile navbar on link click or outside click
    $('.navbar-nav .nav-link:not(.dropdown-toggle), .navbar-nav .dropdown-item, .navbar .btn').on('click', function () {
        if ($('.navbar-collapse').hasClass('show')) {
            $('.navbar-collapse').removeClass('show');
            $('.navbar-toggler').addClass('collapsed').attr('aria-expanded', 'false');
        }
    });

    $(document).on('click touchstart', function (e) {
        var $navbar = $('.navbar');
        if (!$navbar.is(e.target) && $navbar.has(e.target).length === 0 && $('.navbar-collapse').hasClass('show')) {
            $('.navbar-collapse').removeClass('show');
            $('.navbar-toggler').addClass('collapsed').attr('aria-expanded', 'false');
        }
    });


    // Dropdown on mouse hover
    const $dropdown = $(".dropdown");
    const $dropdownToggle = $(".dropdown-toggle");
    const $dropdownMenu = $(".dropdown-menu");
    const showClass = "show";

    $(window).on("load resize", function () {
        if (this.matchMedia("(min-width: 992px)").matches) {
            $dropdown.hover(
                function () {
                    const $this = $(this);
                    $this.addClass(showClass);
                    $this.find($dropdownToggle).attr("aria-expanded", "true");
                    $this.find($dropdownMenu).addClass(showClass);
                },
                function () {
                    const $this = $(this);
                    $this.removeClass(showClass);
                    $this.find($dropdownToggle).attr("aria-expanded", "false");
                    $this.find($dropdownMenu).removeClass(showClass);
                }
            );
        } else {
            $dropdown.off("mouseenter mouseleave");
        }
    });


    // Back to top button & social media icons scroll toggle
    $(window).scroll(function () {
        if ($(this).scrollTop() > 300) {
            $('.back-to-top').addClass('show-btn');
            $('.rightSideFixedSocialIcons').addClass('show-on-scroll');
        } else {
            $('.back-to-top').removeClass('show-btn');
            $('.rightSideFixedSocialIcons').removeClass('show-on-scroll');
        }
    });
    $('.back-to-top').click(function (e) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return false;
    });


    // Facts counter
    $('[data-toggle="counter-up"]').counterUp({
        delay: 10,
        time: 2000
    });


    // Date and time picker
    $('.date').datetimepicker({
        format: 'L'
    });
    $('.time').datetimepicker({
        format: 'LT'
    });


    // Testimonials carousel
    $(".testimonial-carousel").owlCarousel({
        autoplay: true,
        smartSpeed: 1000,
        center: true,
        margin: 25,
        dots: true,
        loop: true,
        nav: false,
        responsive: {
            0: {
                items: 1
            },
            768: {
                items: 2
            },
            992: {
                items: 3
            }
        }
    });

})(jQuery);

