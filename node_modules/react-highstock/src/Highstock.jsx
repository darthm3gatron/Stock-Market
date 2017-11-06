var Highstock = require('highstock-browserify');
var React = require('react');
var update = require('react/addons').addons.update;
module.exports = React.createClass({
    displayName: 'Highstock',

    renderChart: function () {
        if (!this.props.config) {
            throw new Error('Config has to be specified, for the Highchart component');
        }

        var config = this.props.config;
        var node = this.refs.chart.getDOMNode();

        if (!config.chart) {
            config = update(config, {chart: {$set: {}}})
        }

        config = update(config, {chart: {renderTo: {$set: node}}});

        this.chart = new Highstock.Chart(config);
    },

    getChart: function() {
        if (!this.chart) {
            throw new Error('getChart() should not be called before the component is mounted');
        }
        return this.chart;
    },

    componentDidMount: function () {
        this.renderChart();
    },
    componentDidUpdate: function () {
        this.renderChart();
    },
    render: function () {
        return React.createElement('div', {className: 'chart', ref:'chart'});
    }
});

module.exports.Highstock = Highstock;
