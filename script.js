$(document).ready(() => {
  const API_KEY = 'ENTER YOU API KEY HERE';
  $('#search-button').on('click', () => {
    const searchValue = $('#search-value').val();

    // clear input box
    $('#search-value').val('');

    searchWeather(searchValue);
  });

  $('.history').on('click', 'li', function () {
    searchWeather($(this).text());
  });

  const makeRow = (text) => {
    const li = $('<li>')
      .addClass('list-group-item list-group-item-action')
      .text(text);
    $('.history').append(li);
  };

  const searchWeather = (searchValue) => {
    $.ajax({
      type: 'GET',
      url:
        'http://api.openweathermap.org/data/2.5/weather?q=' +
        searchValue +
        '&appid=' +
        API_KEY +
        '&units=imperial',
      dataType: 'json',
      success: (data) => {
        // create history link for this search
        console.log(history);
        if (history.indexOf(searchValue) === -1) {
          if (history.length === 10) {
            history.shift();
          }
          history.push(searchValue);
          window.localStorage.setItem('history', JSON.stringify(history));

          makeRow(searchValue);
        }

        // clear any old content
        $('#today').empty();

        // create html content for current weather
        const title = $('<h3>')
          .addClass('card-title')
          .text(data.name + ' (' + new Date().toLocaleDateString() + ')');
        const card = $('<div>').addClass('card');
        const wind = $('<p>')
          .addClass('card-text')
          .text('Wind Speed: ' + data.wind.speed + ' MPH');
        const humid = $('<p>')
          .addClass('card-text')
          .text('Humidity: ' + data.main.humidity + '%');
        const temp = $('<p>')
          .addClass('card-text')
          .text('Temperature: ' + data.main.temp + ' °F');
        const cardBody = $('<div>').addClass('card-body');
        const img = $('<img>').attr(
          'src',
          'http://openweathermap.org/img/w/' + data.weather[0].icon + '.png'
        );

        // merge and add to page
        title.append(img);
        cardBody.append(title, temp, humid, wind);
        card.append(cardBody);
        $('#today').append(card);

        // get city coords for forecast api
        const coords = {
          lat: data.coord.lat,
          lon: data.coord.lon,
        };

        // call follow-up api endpoints
        getForecast(coords);
        getUVIndex(coords);
      },
    });
  };

  const getForecast = (coords) => {
    $.ajax({
      type: 'GET',
      url:
        'http://api.openweathermap.org/data/2.5/onecall?' +
        'lat=' +
        coords.lat +
        '&lon=' +
        coords.lon +
        '&exclude=hourly,minutely,alerts&appid=' +
        API_KEY +
        '&units=imperial',
      dataType: 'json',
      success: (data) => {
        // overwrite any existing content with title and empty row
        $('#forecast')
          .html('<h4 class="mt-3">5-Day Forecast:</h4>')
          .append('<div class="row">');

        const maxTempValues = [];
        const minTempValues = [];
        const dailyTemps = [];

        // loop over all forecasts (up to five days)
        for (let i = 0; i < 5; i++) {
          const col = $('<div>').addClass('col-md-2');
          const card = $('<div>').addClass(
            'card bg-primary text-white mt-2 mb-2'
          );
          const body = $('<div>').addClass('card-body p-2');
          const date = new Date();
          date.setDate(date.getDate() + i + 1);
          const dateFormated = date.toLocaleDateString();

          const title = $('<h5>').addClass('card-title').text(dateFormated);

          const img = $('<img>').attr(
            'src',
            'http://openweathermap.org/img/w/' +
              data.daily[i].weather[0].icon +
              '.png'
          );

          maxTempValues.push(data.daily[i].temp.max);
          minTempValues.push(data.daily[i].temp.min);
          dailyTemps.push(data.daily[i].temp.day);

          const p1 = $('<p>')
            .addClass('card-text')
            .text('Morning: ' + data.daily[i].temp.morn + ' °F');
          const p2 = $('<p>')
            .addClass('card-text')
            .text('Day: ' + data.daily[i].temp.day + ' °F');
          const p3 = $('<p>')
            .addClass('card-text')
            .text('Night: ' + data.daily[i].temp.night + ' °F');
          const p4 = $('<p>')
            .addClass('card-text')
            .text('Max Temp: ' + data.daily[i].temp.max + ' °F');
          const p5 = $('<p>')
            .addClass('card-text')
            .text('Min Temp: ' + data.daily[i].temp.min + ' °F');
          const p6 = $('<p>')
            .addClass('card-text')
            .text('Humidity: ' + data.daily[i].humidity + '%');

          // merge together and put on page
          col.append(
            card.append(body.append(title, img, p1, p2, p3, p4, p5, p6))
          );
          $('#forecast .row').append(col);
        }
        getForecastStats(maxTempValues, minTempValues, dailyTemps);
      },
    });
  };

  // helper function to find mode of an array
  const mode = (a) =>
    Object.values(
      a.reduce((count, e) => {
        if (!(e in count)) {
          count[e] = [0, e];
        }
        count[e][0]++;
        return count;
      }, {})
    ).reduce((a, v) => (v[0] < a[0] ? a : v), [0, null])[1];

  // function to display all forecast Stats
  const getForecastStats = (max, min, dayTemps) => {
    // clear any old content
    $('#forecastStats').empty();
    $('#forecastStats')
      .html('<h4 class="mt-3">Forecast Stats:</h4>')
      .append('<div class="row">');

    const maxTemp = Math.max(...max);
    const minTemp = Math.min(...min);
    const mean = dayTemps.reduce((a, b) => a + b) / dayTemps.length;
    let modeOfTemps;

    // removing decimals from temps and checking for duplicates.
    const TruncatedTemps = [];
    dayTemps.forEach((element) => TruncatedTemps.push(Math.trunc(element)));
    const isDuplicates = new Set(TruncatedTemps).size !== TruncatedTemps.length;
    // if dupicates are found then find mode, if not return no mode found text.
    if (isDuplicates) {
      modeOfTemps = mode(TruncatedTemps);
    } else {
      modeOfTemps = 'No mode found.';
    }
    // create html content for current weather
    const card = $('<div>').addClass('card');
    const fiveDayMax = $('<p>')
      .addClass('card-text')
      .text('Maximum temperature for next 5 days: ' + maxTemp + ' °F');
    const fiveDayMin = $('<p>')
      .addClass('card-text')
      .text('Minimum temperature for next 5 days: ' + minTemp + ' °F');
    const meanTemp = $('<p>')
      .addClass('card-text')
      .text(
        'Average daily temperature for next 5 days: ' + mean.toFixed(2) + ' °F'
      );
    const modeTemp = $('<p>')
      .addClass('card-text')
      .text('Mode: ' + modeOfTemps);
    const cardBody = $('<div>').addClass('card-body');

    // merge and add to page
    cardBody.append(fiveDayMin, fiveDayMax, meanTemp, modeTemp);
    card.append(cardBody);
    $('#forecastStats').append(card);
  };

  const getUVIndex = (coords) => {
    $.ajax({
      type: 'GET',
      url:
        'http://api.openweathermap.org/data/2.5/uvi?appid=' +
        API_KEY +
        '&lat=' +
        coords.lat +
        '&lon=' +
        coords.lon,
      dataType: 'json',
      success: function (data) {
        const uv = $('<p>').text('UV Index: ');
        const btn = $('<span>').addClass('btn btn-sm').text(data.value);

        // change color depending on uv value
        if (data.value < 3) {
          btn.addClass('btn-success');
        } else if (data.value < 7) {
          btn.addClass('btn-warning');
        } else {
          btn.addClass('btn-danger');
        }

        $('#today .card-body').append(uv.append(btn));
      },
    });
  };

  // get current history, if any
  const history = JSON.parse(window.localStorage.getItem('history')) || [];

  if (history.length > 0) {
    searchWeather(history[history.length - 1]);
  }

  for (let i = 0; i < history.length; i++) {
    makeRow(history[i]);
  }
});
