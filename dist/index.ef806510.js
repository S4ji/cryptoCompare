const red1 = "#e60049";
const red2 = "#b30000";
const green1 = "#00bfa0";
const green2 = "#50e991";
const orange1 = "#ffb55a70";
async function fetchBTCData() {
    const queryStringParameters = {
        tryConversion: "true",
        fsym: "SOL",
        tsym: "USD",
        e: "CCCAGG",
        aggregate: "1",
        aggregatePredictableTimePeriods: "true",
        limit: "365",
        allData: "false",
        extraParams: "my Test APP"
    };
    let qs = new URLSearchParams(queryStringParameters);
    let queryStringified = qs.toString();
    try {
        const response = await fetch(`https://min-api.cryptocompare.com/data/v2/histoday?${queryStringified}`, {
            method: "GET",
            headers: {
                Accept: "application/json",
                authorization: "Apikey authorization: Apikey {f164b8b109893238832587006b37a2ec75e3e296867c1e2795edcf2dc67f8e71}"
            }
        });
        return await response.json();
    } catch (error) {
        console.log("Fetch Error :", error);
    }
}
function saveToStorage() {
    localStorage.setItem("toDoList", JSON.stringify(toDoList));
    console.log(JSON.stringify(localStorage));
}
function loadLocalStorage() {
    toDoList = JSON.parse(localStorage.getItem("toDoList")) || [];
}
function moyenneMobile(array) {
    let sum = array.reduce((acc, val)=>acc + val, 0);
    return sum / array.length;
}
function ecarType(array) {
    if (array.length <= 1) return 0 // or handle this case as you see fit
    ;
    let sum = array.reduce((acc, val)=>acc + Math.pow(val - moyenneMobile(array), 2), 0);
    return Math.sqrt(sum / (array.length - 1));
}
function bollingerUpBar(array, factor) {
    return moyenneMobile(array) + ecarType(array) * factor;
}
function bollingerDownBar(array, factor) {
    return moyenneMobile(array) - ecarType(array) * factor;
}
function formatTimeMonth(timestamp) {
    let dateObject = new Date(timestamp * 1000);
    let month = (dateObject.getMonth() + 1).toString().padStart(2, "0");
    let year = dateObject.getFullYear() % 100;
    return `${month}/${year}`;
}
function formatTimeDays(timestamp) {
    let dateObject = new Date(timestamp * 1000);
    let day = dateObject.getDate().toString().padStart(2, "0");
    let month = (dateObject.getMonth() + 1).toString().padStart(2, "0");
    let year = dateObject.getFullYear() % 100;
    return `${day}/${month}/${year}`;
}
function formatTime24(timestamp) {
    let dateObject = new Date(timestamp * 1000);
    let hours = dateObject.getHours().toString().padStart(2, "0");
    let minutes = dateObject.getMinutes().toString().padStart(2, "0");
    let seconds = dateObject.getSeconds().toString().padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
}
function candleStickBarColorSet(data) {
    return data.map((element)=>{
        return element.open > element.close ? "red" : "green";
    });
}
function renkoColor(data) {
    return data.map((element, index)=>{
        let prevClose;
        if (index === 0) prevClose = (element.open + element.close) / 2;
        else prevClose = (data[index - 1].open + data[index - 1].close) / 2;
        if (element.close > prevClose) return green1;
        else return red2;
    });
}
function haBarColorSet(data) {
    return data.map((element, index)=>{
        let prevClose;
        if (index === 0) prevClose = (element.open + element.close) / 2;
        else prevClose = (data[index - 1].open + data[index - 1].close) / 2;
        if (element.open > prevClose) return green1;
        else return red2;
    });
}
async function processBTCData() {
    const data = await fetchBTCData();
    const filteredData = data.Data.Data.map((element)=>{
        const { high, low, open, close, time } = element;
        return {
            high,
            low,
            open,
            close,
            time,
            average: (element.low + element.high) / 2
        };
    });
    console.log("filtedData", filteredData);
    const labels = filteredData.map((element)=>formatTimeMonth(element.time));
    const y70 = filteredData.map((element)=>element = 70);
    const y30 = filteredData.map((element)=>element = 30);
    const averages = filteredData.map((element)=>element.average);
    const low24group = filteredData.map((element)=>element.low);
    const high24hgroup = filteredData.map((element)=>element.high);
    const open24hgroup = filteredData.map((element)=>element.open);
    const close24hgroup = filteredData.map((element)=>element.close);
    const candleHighLow = filteredData.map((element)=>[
            element.low,
            element.high
        ]);
    const candleOpenClose = filteredData.map((element)=>[
            element.open,
            element.close
        ]);
    const heikinAshiOC = filteredData.reduce((acc, element, index)=>{
        let prevClose;
        if (index === 0) prevClose = (element.open + element.close) / 2;
        else for(let i = 0; i < acc.length; i++){
            const currentCandle = acc[i];
            prevClose = acc[i - 1] ? acc[i - 1][1] : (element.open + element.close) / 2;
        }
        const closeHa = (element.open + element.close + element.high + element.low) / 4;
        const openHa = (prevClose + closeHa) / 2;
        return [
            ...acc,
            [
                openHa,
                closeHa
            ]
        ];
    }, []);
    const heikinAshiHL = filteredData.reduce((acc, element, index)=>{
        let prevClose;
        if (index === 0) prevClose = (element.open + element.close) / 2;
        else for(let i = 0; i < acc.length; i++)prevClose = acc[i - 1] ? acc[i - 1][1] : (element.open + element.close) / 2;
        const closeHa = (element.open + element.close + element.high + element.low) / 4;
        const openHa = (prevClose + closeHa) / 2;
        let highHa = Math.max(element.high, openHa, closeHa);
        let lowHa = Math.min(element.low, openHa, closeHa);
        return [
            ...acc,
            [
                lowHa,
                highHa
            ]
        ];
    }, []);
    const renkoData = filteredData.reduce((acc, element, index)=>{
        let renkoValue = 2000;
        let prevClose;
        if (index === 0) prevClose = (element.close + element.open) / 2;
        else prevClose = acc[acc.length - 1][1];
        if (element.close - prevClose >= renkoValue) acc = [
            ...acc,
            [
                prevClose,
                prevClose + renkoValue
            ]
        ];
        else if (element.close - prevClose >= renkoValue * -1) acc = [
            ...acc,
            [
                prevClose,
                prevClose - renkoValue
            ]
        ];
        return [
            ...acc
        ];
    }, []);
    const renkoLabels = filteredData.reduce((acc, element, index)=>{
        let renkoValue = 2000;
        let prevClose;
        if (index === 0) acc.push(formatTimeDays(element.time));
        else prevClose = acc[acc.length - 1];
        if (index === 0) ;
        else {
            const prevClose = filteredData[index - 1].close;
            if (Math.abs(element.close - prevClose) >= renkoValue) acc.push(formatTimeMonth(element.time));
        }
        return acc;
    }, []);
    let averageBollinger = [];
    let upBoillinger = [];
    let downBoillinger = [];
    const boillingerPeriod = 10 //
    ;
    const boillingerFactor = 2 //
    ;
    filteredData.reduce((acc, element, index)=>{
        const close = filteredData.slice(Math.max(0, index - boillingerPeriod + 1), index + 1).map((data)=>data.close);
        if (close.length >= boillingerPeriod) {
            averageBollinger = [
                ...averageBollinger,
                moyenneMobile(close)
            ];
            upBoillinger = [
                ...upBoillinger,
                bollingerUpBar(close, boillingerFactor)
            ];
            downBoillinger = [
                ...downBoillinger,
                bollingerDownBar(close, boillingerFactor)
            ];
        } else {
            averageBollinger.push(null);
            upBoillinger.push(null);
            downBoillinger.push(null);
        }
        return acc;
    }, []);
    let loss = [];
    let gain = [];
    const RSIperiod = 10;
    filteredData.reduce((acc, element, index)=>{
        const close = filteredData.slice(Math.max(0, index - RSIperiod + 1), index + 1).map((data)=>data.close);
        if (close.length >= RSIperiod) {
            const previousClose = close[close.length - 2];
            const currentClose = close[close.length - 1];
            if (currentClose > previousClose) {
                gain = [
                    ...gain,
                    currentClose - previousClose
                ];
                loss = [
                    ...loss,
                    0
                ];
            } else {
                loss = [
                    ...loss,
                    previousClose - currentClose
                ];
                gain = [
                    ...gain,
                    0
                ];
            }
        } else gain.push(null);
        return acc;
    }, []);
    let rsi = [];
    gain.reduce((acc, element, index)=>{
        let avgGain = [];
        let avgLoss = [];
        const currentLoss = loss[index];
        if (index >= RSIperiod) {
            avgGain = [
                ...avgGain,
                (acc[0] * (RSIperiod - 1) + element) / RSIperiod
            ];
            avgLoss = [
                ...avgLoss,
                (acc[1] * (RSIperiod - 1) + currentLoss) / RSIperiod
            ];
        } else {
            avgGain = [
                ...avgGain,
                0
            ];
            avgLoss = [
                ...avgLoss,
                0
            ];
        }
        const RS = avgGain / avgLoss;
        const currentRSI = 100 - 100 / (1 + RS);
        rsi = [
            ...rsi,
            currentRSI
        ];
        return [
            avgGain,
            avgLoss
        ];
    }, []);
    console.log("rsi", rsi);
    console.log("gain", gain);
    const dataForGraph = {
        labels: labels,
        datasets: [
            // {
            //     label: 'Lowest Price in (EUR)',
            //     data: low24group,
            //     backgroundColor: 'rgba(75, 192, 192, 0.2)',
            //     barPercentage: 1.0, // Adjusts the width of the bars relative to the available space
            //     categoryPercentage: 1.0,
            // },
            // {
            //     type: 'line',
            //     label: 'Average Price in (EUR)',
            //     data: averages,
            //     backgroundColor: 'white',
            //     barPercentage: 1.0, // Adjusts the width of the bars relative to the available space
            //     categoryPercentage: 1.0,
            //     tension: 1,
            // },
            // {
            //     label: 'Highest Price in (EUR)',
            //     data: high24hgroup,
            //     backgroundColor: 'rgba(54, 162, 235, 0.2)',
            //     barPercentage: 1.0,
            //     categoryPercentage: 1.0,
            // },
            {
                type: "bar",
                label: "candleHighLow",
                data: candleHighLow,
                backgroundColor: candleStickBarColorSet(data.Data.Data),
                barPercentage: 0.1,
                categoryPercentage: 1.0
            },
            {
                type: "bar",
                label: "candleOpenClose",
                data: candleOpenClose,
                backgroundColor: candleStickBarColorSet(data.Data.Data),
                barPercentage: 1,
                categoryPercentage: 1.0
            },
            // {
            //     type: 'bar',
            //     label: 'Open-Close',
            //     data: heikinAshiOC,
            //     backgroundColor: haBarColorSet(data.Data.Data),
            //     barPercentage: 1, // Adjusts the width of the bars relative to the available space
            //     categoryPercentage: 1,
            // },
            // {
            //     type: 'bar',
            //     label: 'Low-High',
            //     data: heikinAshiHL,
            //     backgroundColor: haBarColorSet(data.Data.Data),
            //     barPercentage: 0.1,
            //     categoryPercentage: 1.0,
            // },
            {
                type: "line",
                label: "Moyenne Mobile",
                data: averageBollinger,
                backgroundColor: "white",
                borderColor: "white",
                borderWidth: 0.5
            },
            {
                type: "line",
                label: "UP Boillinger",
                data: upBoillinger,
                backgroundColor: orange1,
                borderColor: orange1,
                borderWidth: 0.5,
                tension: 1
            },
            {
                type: "line",
                label: "Down Boillinger",
                data: downBoillinger,
                backgroundColor: orange1,
                backgroundColor: orange1,
                borderColor: orange1,
                borderWidth: 0.5,
                tension: 1
            }
        ]
    };
    const dataForRSI = {
        labels: labels,
        datasets: [
            {
                type: "line",
                label: "RSI",
                data: rsi,
                backgroundColor: red1,
                backgroundColor: red1,
                borderColor: red2,
                borderWidth: 1,
                tension: 1
            },
            {
                type: "line",
                label: "limite",
                data: y70,
                backgroundColor: "yellow",
                backgroundColor: "yellow",
                borderColor: "yellow",
                borderWidth: 1,
                tension: 1
            },
            {
                type: "line",
                label: "limite",
                data: y30,
                backgroundColor: "yellow",
                backgroundColor: "yellow",
                borderColor: "yellow",
                borderWidth: 1,
                tension: 1
            }
        ]
    };
    const ctx = document.getElementById("myChart").getContext("2d");
    const ctx2 = document.getElementById("myRSI").getContext("2d");
    new Chart(ctx, {
        data: dataForGraph,
        type: "line",
        options: {
            elements: {
                point: {
                    radius: 0
                }
            },
            indexAxis: "x",
            responsive: true,
            scales: {
                x: {
                    stacked: true,
                    grid: {
                        // color: 'white',
                        width: 1
                    },
                    ticks: {
                        font: {
                            size: 8
                        },
                        color: "orange",
                        maxRotation: 0,
                        minRotation: 0
                    }
                },
                y: {
                    ticks: {
                        font: {
                            size: 8
                        },
                        color: "orange"
                    },
                    grid: {
                        color: "grey"
                    },
                    beginAtZero: true,
                    min: Math.min(...low24group),
                    max: Math.max(...high24hgroup),
                    ticks: {
                        font: {
                            size: 8
                        },
                        color: "orange"
                    }
                }
            }
        }
    });
    new Chart(ctx2, {
        data: dataForRSI,
        type: "line",
        options: {
            elements: {
                point: {
                    radius: 0
                }
            },
            indexAxis: "x",
            responsive: true,
            scales: {
                x: {
                    stacked: true,
                    grid: {
                        // color: 'white',
                        width: 1
                    },
                    ticks: {
                        font: {
                            size: 8
                        },
                        color: "orange",
                        maxRotation: 0,
                        minRotation: 0
                    }
                },
                y: {
                    ticks: {
                        font: {
                            size: 8
                        },
                        color: "orange"
                    },
                    grid: {
                        color: "grey"
                    },
                    beginAtZero: true,
                    min: 0,
                    max: 100,
                    ticks: {
                        font: {
                            size: 8
                        },
                        color: "orange"
                    }
                }
            }
        }
    });
}
async function getAllCoinList() {
    try {
        const response = await fetch(`https://min-api.cryptocompare.com/data/all/coinlist`, {
            method: "GET",
            headers: {
                Accept: "application/json",
                authorization: "Apikey authorization: Apikey {f164b8b109893238832587006b37a2ec75e3e296867c1e2795edcf2dc67f8e71}"
            }
        });
        console.log(await response.json());
    } catch (error) {
        console.log("Fetch Error :", error);
    }
}
getAllCoinList();
document.addEventListener("DOMContentLoaded", processBTCData);

//# sourceMappingURL=index.ef806510.js.map
