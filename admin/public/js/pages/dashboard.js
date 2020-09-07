//[Dashboard Javascript]

//Project:	Unique Admin - Responsive Admin Template
//Primary use:   Used only for the main dashboard (index.html)


$(function () {

  'use strict';

	// Slim scrolling
  
	  $('.inner-user-div').slimScroll({
		height: '180px'
	  });
	
	
  var options = {
      chart: {
        height: 570,
        type: 'line',
      },
      series: [{
        name: 'Student',
        type: 'column',
        data: [440, 505, 414, 671, 227, 413, 201, 352, 752, 320, 257, 160]
      }, {
        name: 'Employee',
        type: 'line',
        data: [23, 42, 35, 27, 43, 22, 17, 31, 22, 22, 12, 16]
      }],
      stroke: {
        width: [0, 4]
      },
	  legend: {
		position: 'top',
		horizontalAlign: 'left', 
	  },
      // labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
      labels: ['01 Jan 2001', '02 Jan 2001', '03 Jan 2001', '04 Jan 2001', '05 Jan 2001', '06 Jan 2001', '07 Jan 2001', '08 Jan 2001', '09 Jan 2001', '10 Jan 2001', '11 Jan 2001', '12 Jan 2001'],
      xaxis: {
        type: 'datetime'
      },
      yaxis: [{
        title: {
          text: 'Student',
        },

      }, {
        opposite: true,
        title: {
          text: 'Employee'
        }
      }]

    }

    var chart = new ApexCharts(
      document.querySelector("#attendance"),
      options
    );

    chart.render();
	
	
	var options = {
            chart: {
                width: 350,
				height: 250,
                type: 'pie',
            },
			colors:['#dc3912', '#ff9900', '#cccccc'],
            labels: ['Male', 'Female', 'Other'],
            series: [702, 455, 0],
            responsive: [{
                breakpoint: 480,
                options: {
                    chart: {
                        width: 200
                    },
                    legend: {
                        position: 'right'
                    }
                }
            }]
        }

        var chart = new ApexCharts(
            document.querySelector("#studentstrength"),
            options
        );

        chart.render();

}); // End of use strict

