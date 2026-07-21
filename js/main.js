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

    // Infinite Continuous Carousel Autoplay (Fixes last slide 'Dry & Finish' freezing)
    var headerCarouselEl = document.getElementById('header-carousel');
    if (headerCarouselEl && typeof bootstrap !== 'undefined') {
        var headerCarousel = bootstrap.Carousel.getInstance(headerCarouselEl) || new bootstrap.Carousel(headerCarouselEl, {
            interval: 3500,
            wrap: true,
            pause: false
        });
        headerCarousel.cycle();

        headerCarouselEl.addEventListener('slid.bs.carousel', function (e) {
            var totalItems = $('#header-carousel .carousel-item').length;
            if (e.to === totalItems - 1) {
                setTimeout(function () {
                    headerCarousel.to(0);
                    headerCarousel.cycle();
                }, 3500);
            }
        });
    }


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

