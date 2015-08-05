window.samples.push({

    type: 'stacked-bar',
    y: ['Count'],
    x: ['Country'],
    color: 'Sport',

    plugins: [
        tauCharts.api.plugins.get('legend')(),
        tauCharts.api.plugins.get('tooltip')()
    ],

    data: _(olimpics)
        .chain()
        .reduce(function (memo, row) {
            var key = row['Country'] + row['Sport'];
            if (!memo.hasOwnProperty(key)) {
                memo[key] = {
                    'Country': row['Country'],
                    'Sport': row['Sport'],
                    'Count': 0
                };
            }

            memo[key].Count += row['Total Medals'];

            return memo;
        },
        {})
        .values()
        .filter(function (row) {
            return ['Biathlon', 'Ice Hockey'].indexOf(row['Sport']) >= 0;
        })
        .sortBy('Count')
        .value()

});