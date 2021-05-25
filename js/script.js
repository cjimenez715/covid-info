//Global variables
const baseUrl = "https://api.covid19api.com/";
const countriesUrl = "countries";
const countryUrl = "country";
const summaryUrl = "summary";
let countriesData = [];
let selectedCountry = { Country: "Global", ISO2: "global", Slug: "global" };
let summaryData = [];
let selectedDate = new Date();
let lastDate = new Date();
let beforeLastDate = new Date();

const numberFormatter = new Intl.NumberFormat("PT-br");
const dateFormatter = new Intl.DateTimeFormat("EN-us", {
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  second: "numeric",
});
//Controls
const cmbCountries = document.getElementById("cmbCountries");
const txtTotalConfirmed = document.getElementById("txtTotalConfirmed");
const txtTotalDeaths = document.getElementById("txtTotalDeaths");
const txtTotalRecovered = document.getElementById("txtTotalRecovered");
const txtUpdated = document.getElementById("txtUpdated");
const dtpCurrentDate = document.getElementById("dtpCurrentDate");
const lblUpdated = document.getElementById("lblUpdated");
const txtTotalConfirmedComparison = document.getElementById("txtTotalConfirmedComparison");
const txtTotalDeathsComparison = document.getElementById("txtTotalDeathsComparison");
const txtTotalRecoveredComparison = document.getElementById("txtTotalRecoveredComparison");
const txtUpdatedComparison = document.getElementById("txtUpdatedComparison");
const iconTotalConfirmedComparison = document.getElementById("iconTotalConfirmedComparison");
const iconTotalDeathsComparison = document.getElementById("iconTotalDeathsComparison");
const iconTotalRecoveredComparison = document.getElementById("iconTotalRecoveredComparison");
const iconUpdatedComparison = document.getElementById("iconUpdatedComparison");

window.addEventListener("load", () => {
  getCountriesData();
  getSummaryData();
  dtpCurrentDate.value = getDateFormatted(selectedDate);
  dtpCurrentDate.addEventListener("change", dtpCurrentDateHandler);
});

const getCountriesData = async () => {
  let countries = await getFetchData(countriesUrl);
  countries = countries.sort((a, b) => a.Country.localeCompare(b.Country));
  countriesData = [selectedCountry, ...countries];
  loadCountries(countriesData);
};

const getSummaryData = async () => {
  summaryData = await getFetchData(summaryUrl);
  setSummaryData(summaryData);
};

const getFetchData = async (endPointUrl) => {
  const response = await fetch(`${baseUrl}${endPointUrl}`);
  const responseJson = await response.json();
  return responseJson;
};

const convertToOption = ({ Country, ISO2 }) => {
  let option = document.createElement("option");
  option.text = `${Country}`;
  option.value = ISO2;
  option.id = ISO2;
  return option;
};

const loadCountries = (countries) => {
  const options = countries.map(convertToOption);
  options.forEach((option) => {
    cmbCountries.appendChild(option);
  });
  cmbCountries.addEventListener("change", selectedCountryHandler);
};

const selectedCountryHandler = (event) => {
  const iso2 = event.target.value;
  const selectedItem = countriesData.find((country) => country.ISO2 === iso2);
  setSelectedCountry(selectedItem);
};

const setSummaryData = (summary) => {
  const { Global } = summary;
  txtTotalConfirmed.innerText = formatNumbers(Global.TotalConfirmed);
  txtTotalDeaths.innerText = formatNumbers(Global.TotalDeaths);
  txtTotalRecovered.innerText = formatNumbers(Global.TotalRecovered);
  txtUpdated.innerText = formatDates(
    dateFormatter.formatToParts(new Date(Global.Date))
  );
  lblUpdated.innerText = 'Actualizacao';

  txtTotalConfirmedComparison.innerText = '';
  txtTotalDeathsComparison.innerText = '';
  txtTotalRecoveredComparison.innerText = '';
  txtUpdatedComparison.innerText = '';

  clearArrowStyles();
};

const formatNumbers = (number) => numberFormatter.format(number);
const formatDates = (dateParts) => {
  const day = dateParts
    .find((date) => date.type === "day")
    .value.padStart(2, "0");
  const month = dateParts
    .find((date) => date.type === "month")
    .value.padStart(2, "0");
  const year = dateParts
    .find((date) => date.type === "year")
    .value.padStart(2, "0");
  const hour = dateParts
    .find((date) => date.type === "hour")
    .value.padStart(2, "0");
  const minute = dateParts
    .find((date) => date.type === "minute")
    .value.padStart(2, "0");
  return `${day}.${month}.${year.slice(
    year.length - 2,
    year.length
  )} ${hour}:${minute}`;
};

const getDateFormatted = (date) => {
  var d = date,
    month = "" + (d.getMonth() + 1),
    day = "" + d.getDate(),
    year = d.getFullYear();

  if (month.length < 2) month = "0" + month;
  if (day.length < 2) day = "0" + day;

  return [year, month, day].join("-");
};

const setSelectedCountry = (selectedItem) => {
  selectedCountry = selectedItem;
  getSummaryDataByCountryAndDate();
};

const dtpCurrentDateHandler = (event) => {
  if (event.target.value) {
    selectedDate = new Date(event.target.value);
  }
  getSummaryDataByCountryAndDate();
};

const getSummaryDataByCountryAndDate = async () => {
  if (selectedDate && selectedCountry) {
    if (selectedCountry.Slug !== "global") {
      lastDate = new Date(selectedDate.getTime());
      lastDate.setDate(lastDate.getDate() - 1);
      beforeLastDate = new Date(lastDate.getTime());
      beforeLastDate.setDate(beforeLastDate.getDate() - 1);
      const countryFromToUrl = `${countryUrl}/${selectedCountry.Slug}?from=${beforeLastDate.toISOString().substr(0, 10)}T00:00:00Z&to=${selectedDate.toISOString().substr(0, 10)}T00:00:00Z`;
      const data = await getFetchData(countryFromToUrl);
      setSummaryByCountryAndDate(data);
    } else {
      getSummaryData();
    }
  }
};

const filterByDate = (date, comparedDate) => {
  const dateAux = new Date(date);
  return (
    dateAux.getDay() === comparedDate.getDay() &&
    dateAux.getMonth() === comparedDate.getMonth() &&
    dateAux.getFullYear() === comparedDate.getFullYear()
  );
};

const setSummaryByCountryAndDate = (data) => {
  const beforeLastDateData = data.filter((d) => filterByDate(d.Date, beforeLastDate));
  const lastDateData = data.filter((d) => filterByDate(d.Date, lastDate));
  const selectedDateData = data.filter((d) =>
    filterByDate(d.Date, selectedDate)
  );

  // prettier-ignore
  const totalConfirmedBeforeLast = beforeLastDateData.reduce((acc, item) => acc + item.Confirmed, 0);
  const totalDeathsBeforeLast = beforeLastDateData.reduce((acc, item) => acc + item.Deaths, 0);
  const totalRecoveredBeforeLast = beforeLastDateData.reduce((acc, item) => acc + item.Recovered, 0);
  const totalActivesBeforeLast = beforeLastDateData.reduce((acc, item) => acc + item.Active, 0);

  const totalConfirmedLast = lastDateData.reduce((acc, item) => acc + item.Confirmed, 0);
  const totalDeathsLast = lastDateData.reduce((acc, item) => acc + item.Deaths, 0);
  const totalRecoveredLast = lastDateData.reduce((acc, item) => acc + item.Recovered, 0);
  const totalActivesLast = lastDateData.reduce((acc, item) => acc + item.Active, 0);
  
  const totalConfirmed = selectedDateData.reduce((acc, item) => acc + item.Confirmed, 0);
  const totalDeaths = selectedDateData.reduce((acc, item) => acc + item.Deaths, 0);
  const totalRecovered = selectedDateData.reduce((acc, item) => acc + item.Recovered, 0);
  const totalActives = selectedDateData.reduce((acc, item) => acc + item.Active, 0); 
  
  txtTotalConfirmedComparison.innerText = "Diario " + Math.abs(formatNumbers(totalConfirmed - totalConfirmedLast));
  txtTotalDeathsComparison.innerText = "Diario " + Math.abs(formatNumbers(totalDeaths - totalDeathsLast));
  txtTotalRecoveredComparison.innerText = "Diario " + Math.abs(formatNumbers(totalRecovered - totalRecoveredLast));
  txtUpdatedComparison.innerText = "Diario " + Math.abs(formatNumbers(totalActives - totalActivesLast));


  if((totalConfirmed - totalConfirmedLast) > (totalConfirmedLast - totalConfirmedBeforeLast)){
    iconTotalConfirmedComparison.classList.remove("fa-long-arrow-alt-down");
    iconTotalConfirmedComparison.classList.add("fa-long-arrow-alt-up");
  } else {
    iconTotalConfirmedComparison.classList.remove("fa-long-arrow-alt-up");
    iconTotalConfirmedComparison.classList.add("fa-long-arrow-alt-down");
  }

  if((totalDeaths - totalDeathsLast) > (totalDeathsLast - totalDeathsBeforeLast)){
    iconTotalDeathsComparison.classList.remove("fa-long-arrow-alt-down");
    iconTotalDeathsComparison.classList.add("fa-long-arrow-alt-up");
  } else {
    iconTotalDeathsComparison.classList.remove("fa-long-arrow-alt-up");
    iconTotalDeathsComparison.classList.add("fa-long-arrow-alt-down");
  }

  if((totalRecovered - totalRecoveredLast) > (totalRecoveredLast - totalRecoveredBeforeLast)){
    iconTotalRecoveredComparison.classList.remove("fa-long-arrow-alt-down");
    iconTotalRecoveredComparison.classList.add("fa-long-arrow-alt-up");
  }
  else{
    iconTotalRecoveredComparison.classList.remove("fa-long-arrow-alt-up");
    iconTotalRecoveredComparison.classList.add("fa-long-arrow-alt-down");
  }

  if((totalActives - totalActivesLast) > (totalActivesLast - totalActivesBeforeLast)){
    iconUpdatedComparison.classList.remove("fa-long-arrow-alt-down");
    iconUpdatedComparison.classList.add("fa-long-arrow-alt-up");
  } else {
    iconUpdatedComparison.classList.remove("fa-long-arrow-alt-up");
    iconUpdatedComparison.classList.add("fa-long-arrow-alt-down");
  }

  txtTotalConfirmed.innerText = formatNumbers(totalConfirmed);
  txtTotalDeaths.innerText = formatNumbers(totalDeaths);
  txtTotalRecovered.innerText = formatNumbers(totalRecovered);
  txtUpdated.innerText = formatNumbers(totalActives);
  lblUpdated.innerText = 'Ativos';
};

const clearArrowStyles = () => {
    const icons = document.querySelectorAll('i');
    icons.forEach(icon => {
        icon.className = 'fa';
    })
}