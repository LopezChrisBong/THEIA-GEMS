import mitt from 'mitt';
import axios from "axios";
import moment from "moment";
const eventHub = mitt();
export default {
    created() {
        this.token = localStorage.getItem("token");
      },
    data() {
      return {
        token: "",
        apiUrl: process.env.VUE_APP_SERVER,
        eventHub,
        MAX_DISCOUNT_AMOUNT: 10000,
        formRules: {
            amountExceeded: function(amount, principal, num_of_months) {
              if (parseFloat(amount) <= parseFloat(principal)) {
                if (
                  parseFloat(amount) < parseFloat(principal) &&
                  num_of_months > 1
                ) {
                  return "Amount must be equal to the payment amount for multiple months";
                } else {
                  return true;
                }
              } else {
                return "Amount must be less than or equal to the payment amount";
              }
            },
            numberRequired: function(value, customMessage) {
              if (!(value <= 0)) {
                let numberRegex = /^\s*[+-]?(\d+|\d*\.\d+|\d+\.\d*)([Ee][+-]?\d+)?\s*$/;
                if (numberRegex.test(value)) {
                  return true;
                } else {
                  return customMessage ? customMessage : "Should be more than zero";
                }
              } else {
                return customMessage ? customMessage : "Should be more than zero";
              }
            },
            hgtInMtrFormat: function(value, customMessage) {
              if (value != "" && value != null) {
                let numberRegex = /^\d+\.?\d*$/;
                if (numberRegex.test(value)) {
                  if (parseFloat(value) <= 3.0 && parseFloat(value) >= 1.0) {
                    return true;
                  } else {
                    return customMessage
                      ? customMessage
                      : "Should not be greater than 3 or less than 1 value. (e.g 1.65)";
                  }
                } else {
                  return customMessage
                    ? customMessage
                    : "Should be in meter format (e.g 1.65)";
                }
              } else {
                return customMessage ? customMessage : "Required";
              }
            },
    
            bdateAgeAllowed: function(value, customMessage) {
              if (value != "" && value != null) {
                var dob = new Date(value);
                var diff_ms = Date.now() - dob.getTime();
                var age_dt = new Date(diff_ms);
                var cur_age = Math.abs(age_dt.getUTCFullYear() - 1970);
                if (cur_age >= 18) {
                  return true;
                } else {
                  return customMessage ? customMessage : "Age not valid.";
                }
              } else {
                return customMessage ? customMessage : "Required";
              }
            },
    
            ageAllowed: function(value, customMessage) {
              if (value <= 18) {
                return true;
              } else {
                return customMessage ? customMessage : "Age is over allowed age.";
              }
            },
    
            zeroAllowed: function(value, customMessage) {
              if (value || value == "0") {
                if (parseInt(value) >= 0) {
                  return true;
                } else {
                  return customMessage ? customMessage : "No negative value";
                }
              } else {
                return customMessage ? customMessage : "Required";
              }
            },
            isValidYear: function(value, customMessage) {
              let d = new Date();
              let yr = d.getFullYear();
              if (value) {
                if (value >= 1900 && value <= yr) {
                  return true;
                } else {
                  return customMessage ? customMessage : "Invalid year";
                }
              } else {
                return customMessage ? customMessage : "Required";
              }
            },
    
            isValidFiscalYear: function(value, customMessage) {
              if (value) {
                if (value >= 1900 && value <= 2100) {
                  return true;
                } else {
                  return customMessage ? customMessage : "Invalid year";
                }
              } else {
                return customMessage ? customMessage : "Required";
              }
            },
    
            NullValidYear: function(value, customMessage) {
              let d = new Date();
              let yr = d.getFullYear();
              if (value == null || value == "" || value.toLowerCase() == "n/a") {
                return true;
              } else {
                if (value >= 1900 && value <= yr) {
                  return true;
                } else {
                  return customMessage ? customMessage : "Invalid year";
                }
              }
            },
            dateNotEqual: function(value1, value2) {
              if (!value1 || !value2) {
                return true;
              } else {
                return value1 !== value2 || "Dates should not be equal.";
              }
            },
            noNegativeNumberAllowed: function(value, customMessage) {
              if (!(value < 0) || value == null || value == "") {
                return true;
              } else {
                return customMessage ? customMessage : "Negative value not allowed";
              }
            },
            arrayRequired: function(value, customMessage) {
              if (value.length > 0) {
                return true;
              } else {
                return customMessage ? customMessage : "Required";
              }
            },
            numberRequiredButEmptyAllowed: function(value, customMessage) {
              if (!(value <= 0) || value == null || value == "") {
                return true;
              } else {
                return customMessage ? customMessage : "Should be more than zero";
              }
            },
    
            onlyNumberNoNegative: function(value, customMessage) {
              if (value >= 0 || Math.sign(value) == 1 || value == null) {
                return true;
              } else {
                return customMessage ? customMessage : "Should be more than zero";
              }
            },
    
            numberNotAboveFiveOrBelowZero: function(value, customMessage) {
              if (
                parseFloat(value) >= 1 &&
                parseFloat(value) <= 5 &&
                value != null
              ) {
                return true;
              } else {
                return customMessage
                  ? customMessage
                  : "Should be more than zero or less than five!";
              }
            },
    
            noDecimal: (value) => {
              if (value === null || value == "") {
                return true;
              }
              const pattern = /^[1-9]\d{0,2}(\.\d{3})*(,\d+)?$/;
              return pattern.test(value) || "Decimal is not allowed";
            },
            required: (value) => !!value || "Required",
            email: (value) => {
              if (value === null || value == "") {
                return true;
              }
              const pattern1 = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,10}$/;
              const pattern = /^[a-z0-9](?!.*?[^\na-z0-9]{2}).*?[a-z0-9]$/gim;
              return (
                (pattern.test(value) && pattern1.test(value)) || "Invalid e-mail."
              );
            },
            emaildnsc: (value) => {
              if (value === null || value == "") {
                return true;
              }
              let res = "";
              if (value.includes("@")) {
                res = value.substring(value.indexOf("@"), value.length);
              }
              return res === "@dnsc.edu.ph" || "Invalid e-mail.";
            },
            requiredArray: (arr) => {
              return Array.isArray(arr)
                ? arr.length > 0
                  ? true
                  : "Required"
                : "Required";
            },
            zipcode: (value) => {
              if (value === null || value == "") {
                return true;
              }
              const pattern = /^[0-9]{5}(?:-[0-9]{4})?$/;
              return pattern.test(value) || "Invalid zipcode";
            },
            dashAndUnderscore: (value) => {
              if (value === null || value == "") {
                return true;
              }
              const pattern = /^[a-zA-Z0-9-_]+$/;
              return pattern.test(value) || "Undercore and Dash are only allowed";
            },
            alphaNumbericunderscoreDash: (value) => {
              if (value === null || value == "") {
                return true;
              }
              const pattern = /^[a-zA-Z0-9-_]+$/;
              return (
                pattern.test(value) ||
                "Alpha,Numberic,Undercore, & Dash are only allowed"
              );
            },
            password: (value) => {
              if (value === null || value == "") {
                return true;
              }
              const pattern = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[^\w\s]).{8,}$/;
              return (
                pattern.test(value) ||
                "Password should be at least 8 characters, must have 1 special character, must have 1 small letter,1 capital letter, and 1 number"
              );
            },
    
            confirmPassword: function(a, b) {
              if (a === null || a == "" || b === null || b == "") {
                return true;
              }
              return a === b || "The passwords are not identical. Please try again";
            },
    
            isRequiredIfValueNotEmpty: function(value, thisValue) {
              if (value === null || value == "") {
                return true;
              } else {
                return !!thisValue || "Required";
              }
            },
            maxDiscount: function(value) {
              if (value === null || value === "" || value === undefined) {
                return true;
              }
              return (
                Number(value) <= 10000 ||
                "Discount cannot exceed ₱10,000.00"
              );
            },
          },
      };
    },

    methods: {
        reloadImg(url) {
            return url + '?t=' + Date.now();
          },
        // Clamps a discount value to [0, MAX_DISCOUNT_AMOUNT] — shared utility
        // so every discount input across the app enforces the same ceiling.
        clampDiscount: function(value) {
          const n = Math.max(0, Number(value) || 0);
          return Math.min(n, this.MAX_DISCOUNT_AMOUNT);
        },
        toSentenceCase: function(theString) {
          var newString = theString
            .toLowerCase()
            .replace(/(^\s*\w|[.!?]\s*\w)/g, function(c) {
              return c.toUpperCase();
            });
          return newString;
        },
    
        formatPrice: function(value) {
          const val = (value / 1).toFixed(2).replace(",", ".");
          return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        },
        formatNumberValue: function(value, decimals) {
          const val = (value / 1).toFixed(decimals).replace(",", ".");
          return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        },
        numberFormatter: function(value) {
          return Number(value).toLocaleString("en", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
        },
        deleteToken: function() {
          localStorage.removeItem("token");
          localStorage.removeItem("vuex");
          localStorage.removeItem("_secure__ls__metadata");
          this.$store.dispatch("setEmail", null);
          this.$store.dispatch("setEmp", null);
          this.$store.dispatch("setIsAuthenticated", 0);
          this.$router.replace("/");
        },
        logout: function() {
          this.deleteToken();
          // this.$store.dispatch("setEmail", null)
          // this.$store.dispatch("setIsAuthenticated", 0)
          // location.reload();
        },
        closeDialog: function() {
          this.eventHub.$emit("closeDialog", false);
        },
        axiosCall: function(url, method, data, setToken) {
          let options = {
            method: method,
            url: this.apiUrl + url,
            data: data,
            headers: {},
          };
    
          if (method.toLowerCase() === "get" && data) {
            if (Object.keys(data).length > 0) {
              options.params = data;
            }
          }
    
          if (setToken == undefined || setToken) {
            if (this.token) {
              options.headers = {
                Authorization: `Bearer ${this.token}`,
              };
            }
          }
    
          return axios(options).catch((error) => {
            if (error.response.statusCode == 401) {
              console.log(error);
              this.deleteToken();
              this.logout();
              this.$router.push("/");
            } else {
              return error.response;
            }
          });
        },
        toTitleCase: function(str) {
          return str.replace(/\w\S*/g, function(txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
          });
        },
    
        toLowerCaseAndDashSpace: function(str) {
          return str.replace(/\s+/g, "-").toLowerCase();
        },
         toUpperCaseData: function(str) {
          return str.replace(/\s+/g, " ").toUpperCase();
        },
        numberWithCommas: function(x) {
          return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        },
        numberOnly: function(str) {
          return str;
        },
        getNumberSuffix: function(val) {
          if (val <= 0) {
            return;
          }
          var j = val % 10,
            k = val % 100;
          if (j == 1 && k != 11) {
            return val + "st";
          }
          if (j == 2 && k != 12) {
            return val + "nd";
          }
          if (j == 3 && k != 13) {
            return val + "rd";
          }
          return val + "th";
        },
    
        calculateAge: function(value) {
          var dob = new Date(value);
          var diff_ms = Date.now() - dob.getTime();
          var age_dt = new Date(diff_ms);
          return Math.abs(age_dt.getUTCFullYear() - 1970);
        },
        truncateText: function(text, length, clamp) {
          clamp = clamp || "...";
          var node = document.createElement("div");
          node.innerHTML = text;
          var content = node.textContent;
          return content.length > length
            ? content.slice(0, length) + clamp
            : content;
        },
        splitFirstnameLastname: function(fullname) {
          let tempString = fullname.split(" "),
            firstName = tempString[0],
            lastName = tempString[tempString.length - 1];
    
          return {
            firstName: firstName,
            lastName: lastName,
          };
        },
    
        getDateDiff(date) {
          let today = new Date();
          let d = today.getDate();
          let m = today.getMonth() + 1;
          let y = today.getFullYear();
    
          let comp = new Date(date);
          let cd = comp.getDate();
          let cm = comp.getMonth() + 1;
          let cy = comp.getFullYear();
    
          let date1 = moment([y, m, d]);
          let date2 = moment([cy, cm, cd]);
    
          return date1.diff(date2, "days");
        },
    
        getYear(date, format = "YYYY") {
          if (date) {
            return moment(date).format(format);
          }
        },
        formatDate(date, format = "MMM. DD, YYYY") {
          if (date) {
            return moment(date).format(format);
          }
        },
        formatDateYear(date, format = "MMMM YYYY") {
          if (date) {
            return moment(date).format(format);
          }
        },
        formatDate3(date, format = "YYYY-MM-DD") {
          if (date) {
            return moment(date).format(format);
          }
        },
        formatDateTime(date, format = "MMM. DD, YYYY HH:mm") {
          if (date) {
            return moment(date).format(format);
          }
        },
        formatTime(time, format = "hh:mm A") {
          if (time) {
            return moment(time, "HH:mm:ss").format(format);
          }
        },
        formatDate2(date, format = "D MMM YYYY") {
          if (date) {
            return moment(date).format(format);
          }
        },
        formatDateTime2(date, format = "D MMM YYYY HH:mm") {
          if (date) {
            return moment(date).format(format);
          }
        },
        formatDateTime3(date, format = "LLL") {
          if (date) {
            return moment(date).format(format);
          }
        },
    
        formatDate4(date) {
          return moment(date).format("MM/DD/YY");
        },
        formatDateTimeAgo(date) {
          const intervals = [
            { label: "year", seconds: 31536000 },
            { label: "month", seconds: 2592000 },
            { label: "day", seconds: 86400 },
            { label: "hour", seconds: 3600 },
            { label: "minute", seconds: 60 },
            { label: "second", seconds: 1 },
          ];
          if (date) {
            let d = new Date(date);
            // let m = d.getMonth() + 1;
            // let dd = d.getDate();
            // let yy = d.getFullYear();
            // let ddd = yy+''+this.prependZero(m)+''+this.prependZero(dd)
    
            // return moment(ddd).fromNow();
            const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
            const interval = intervals.find((i) => i.seconds < seconds);
            const count = Math.floor(seconds / interval.seconds);
            return `${count} ${interval.label}${count !== 1 ? "s" : ""} ago`;
          }
        },
        prependZero(num) {
          if (num < 10) {
            return "0" + num;
          }
          return num;
        },
        getImageFileForPreview: function(file, callback) {
          let reader = new FileReader();
    
          reader.onload = function(e) {
            callback(e.target.result);
          };
    
          reader.readAsDataURL(file);
        },
        createObjectReplicaNonReactive: function(data) {
          return JSON.parse(JSON.stringify(data));
        },
    
        decodeHtml: function(html) {
          var txt = document.createElement("textarea");
          txt.innerHTML = html;
          return txt.value;
        },
    
        generateRandomCharacters: function(num = 20) {
          let text = "",
            chars =
              "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
          for (let i = 1; i <= num; i++) {
            text += chars.charAt(Math.floor(Math.random() * chars.length));
          }
          return text;
        },
      },
  };