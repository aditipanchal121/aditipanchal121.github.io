$(document).ready(function() { 
    $('#slides').superslides({
        animation: 'fade',
        play: 5000,
        pagination: false
    });

    var typed = new Typed(".typed", {
        strings: ["I am a machine learning researcher.","I am an aspiring software engineer.",
        "I am a Women in Engineering ambassador.", "I am a frequent volunteer.", "I am an avid reader.",
        "I am a food enthusiast."],
        typeSpeed: 100,
        loop: true,
        startDelay: 1000,
        showCursor: true,
        smartBackspace: true,
        shuffle: true,
        backSpeed: 10,
        cursorBlinking: true
    })

    $('.owl-carousel').owlCarousel({
        loop:true,
        autoPlay: true,
        items: 4,
        itemsDesktop:[1000,4],
		itemsDesktopSmall:[900,3],
		itemsTablet:[600,2],
		itemsMobile:[480,1]
    })

    var skillsTopOffset = $(".skillSection").offset().top;
    
    $(window).scroll(function(){
        if(window.pageYOffset > skillsTopOffset - $(window).height() + 200){
            $('.chart').easyPieChart({
                easing: "easeInOut",
                barColor: "#FFF",
                lineWidth: 4,
                size: 152,
                trackColor: false,
                scaleColor: false,
                onStep: function(from, to, percent)
                {
                    $(this.el).find(".percent").text(Math.round(percent))
                }
            });
        }
    })

    $("[data-fancybox]").fancybox()

    $(".items").isotope({
        filter: '*',
        animationOptions: {
            duration: 1500,
            easing: 'linear',
            queue: false
        }
    })

    $("#filters a").click(function() {
        $("#filters .current").removeClass("current")
        $(this).addClass("current")

        var selector = $(this).attr("data-filter")

        $(".items").isotope({
            filter: selector,
            animationOptions: {
                duration: 1500,
                easing: 'linear',
                queue: false
            }
        })

        return false
    })

    $("#navigation li a").click(function(e) {
        e.preventDefault()
        var target = $(this).attr("href")
        var targetPos = $(target).offset().top;
        $("html, body").animate({scrollTop: targetPos - 50}, "slow")
    })

    $(".learnButton").click(function(e) {
        e.preventDefault()
        var target = $(this).attr("href")
        var targetPos = $(target).offset().top;
        $("html, body").animate({scrollTop: targetPos - 50}, "slow")
    })

    const nav = $("#navigation");
    const navTop = nav.offset().top;

    function stickyNavigation()
    {
        var body = $("body");

        if($(window).scrollTop() >= navTop)
        {
            body.css("padding-top", nav.outerHeight()+ "px")
            body.addClass("fixedNav");
        }
        else
        {
            body.css("padding-top", 0)
            body.removeClass("fixedNav");
        }
    }

    $(window).on("scroll", stickyNavigation);


})