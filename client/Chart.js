import React from 'react'
import HighCharts from 'highcharts'
import ReactHighCharts from 'react-highcharts'

class Chart extends React.Component {
    shouldComponentUpdate(nextProps, nextState) {
        if(nextProps.initStatus !== this.props.initStatus) {
            return true;
        } else if(nextProps.stockData.length === this.props.stockData.length) {
            return false;
        } else {
            return true;
        }
    }
    render() {
        let chartData = this.props.stockData.map((stock) => {
            return {
                name: stock.dataset.dataset_code,
                data: stock.dataset.data.map((priceData) => {
                    return [priceData[0], priceData[1]]
                })
            }
        });
        let slicedData = chartData.map((stock) => {
            return {
                name: stock.name,
                data: stock.data.slice(0, 1000).reverse()
            }
        })
        let config = {
            rangeSelector: {
                selected: 1
            },
            title: {
                text: 'Stock Prices over the last 1,000 days'
            },
            plotOptions: {
                series: {
                    compare: 'percent',
                    showInNavigator: true
                }
            },
            tooltip: {
                pointFormat: '<span style="color:{series.color}">{series.name}</span>: <b>${point.y}</b><br/>'
                valueDecimals: 2,
                split: true
            },
            series: slicedData
        }
        return (
            <div className = 'chartWrapper'>
				{ !this.props.initStatus && chartData.length > 0 && <ReactHighCharts className = 'chart' config = {config} ref = 'chart' /> }
			</div>
        );
    }
};

export default Chart;