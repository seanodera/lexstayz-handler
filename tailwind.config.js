

const primaryColor = {
  '50': '#eef0ff',
  '100': '#dfe4ff',
  '200': '#c5ccff',
  '300': '#a2a9ff',
  '400': '#7f7efb',
  '500': '#584cf4',
  '600': '#5b41ea',
  '700': '#4d34ce',
  '800': '#3f2da6',
  '900': '#372c83',
  '950': '#221a4c',
  "DEFAULT": '#584cf4',
};


module.exports = {
  content: [
    './templates/**/*.html', // Point to your HTML email templates
  ],
  theme: {
    extend: {
      colors: {
        primary: primaryColor,
        dark: '#001529',
        danger: '#FF4D4F',
        warning: '#faad14',
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
            "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      aspectRatio: {
        '20/7': '20 / 7',
      },
      maxWidth: {
        '1/4': '25%',
        '1/2': '50%',
        '3/4': '75%',
        "8": '8rem',
      },
      width: {
        '1/24': '4.16666666667%',
        '2/24': '8.33333333333%',
        '3/24': '12.5%',
        '4/24': '16.6666666667%',
        '5/24': '20.8333333333%',
        '6/24': '25%',
        '7/24': '29.1666666667%',
        '8/24': '33.3333333333%',
        '9/24': '37.5%',
        '10/24': '41.6666666667%',
        '11/24': '45.8333333333%',
        '12/24': '50%',
        '13/24': '54.1666666667%',
        '14/24': '58.3333333333%',
        '15/24': '62.5%',
        '16/24': '66.6666666667%',
        '17/24': '70.8333333333%',
        '18/24': '75%',
        '19/24': '79.1666666667%',
        '20/24': '83.3333333333%',
        '21/24': '87.5%',
        '22/24': '91.6666666667%',
        '23/24': '95.8333333333%',
        '1/100': '1%',
        '2/100': '2%',
        '3/100': '3%',
        '4/100': '4%',
        '5/100': '5%',
        '6/100': '6%',
        '7/100': '7%',
        '8/100': '8%',
        '9/100': '9%',
        '10/100': '10%',
        '11/100': '11%',
        '12/100': '12%',
        '13/100': '13%',
        '14/100': '14%',
        '15/100': '15%',
        '16/100': '16%',
        '17/100': '17%',
        '18/100': '18%',
        '19/100': '19%',
        '20/100': '20%',
        '21/100': '21%',
        '22/100': '22%',
        '23/100': '23%',
        '24/100': '24%',
        '25/100': '25%',
        '26/100': '26%',
        '27/100': '27%',
        '28/100': '28%',
        '29/100': '29%',
        '30/100': '30%',
        '31/100': '31%',
        '32/100': '32%',
        '33/100': '33%',
        '34/100': '34%',
        '35/100': '35%',
        '36/100': '36%',
        '37/100': '37%',
        '38/100': '38%',
        '39/100': '39%',
        '40/100': '40%',
        '41/100': '41%',
        '42/100': '42%',
        '43/100': '43%',
        '44/100': '44%',
        '45/100': '45%',
        '46/100': '46%',
        '47/100': '47%',
        '48/100': '48%',
        '49/100': '49%',
        '50/100': '50%',
        '51/100': '51%',
        '52/100': '52%',
        '53/100': '53%',
        '54/100': '54%',
        '55/100': '55%',
        '56/100': '56%',
        '57/100': '57%',
        '58/100': '58%',
        '59/100': '59%',
        '60/100': '60%',
        '61/100': '61%',
        '62/100': '62%',
        '63/100': '63%',
        '64/100': '64%',
        '65/100': '65%',
        '66/100': '66%',
        '67/100': '67%',
        '68/100': '68%',
        '69/100': '69%',
        '70/100': '70%',
        '71/100': '71%',
        '72/100': '72%',
        '73/100': '73%',
        '74/100': '74%',
        '75/100': '75%',
        '76/100': '76%',
        '77/100': '77%',
        '78/100': '78%',
        '79/100': '79%',
        '80/100': '80%',
        '81/100': '81%',
        '82/100': '82%',
        '83/100': '83%',
        '84/100': '84%',
        '85/100': '85%',
        '86/100': '86%',
        '87/100': '87%',
        '88/100': '88%',
        '89/100': '89%',
        '90/100': '90%',
        '91/100': '91%',
        '92/100': '92%',
        '93/100': '93%',
        '94/100': '94%',
        '95/100': '95%',
        '96/100': '96%',
        '97/100': '97%',
        '98/100': '98%',
        '99/100': '99%',
        '100/100': '100%',
      },
    },
  },
  plugins: [],
  // For purging unused styles
  purge: ['./templates/**/*.html'],
};
