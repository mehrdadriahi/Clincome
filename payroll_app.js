/* JS logic for Payroll Tracker */
let currentTab = 'payrolls';
let payrolls = JSON.parse(localStorage.getItem('payrolls') || '[]');
let chart;

function showTab(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.add('hidden'));
  document.getElementById(tab).classList.remove('hidden');
  currentTab = tab;
  if (tab === 'reports') drawChart();
}

function openModal() {
  document.getElementById('modal').style.display = 'flex';
  document.getElementById('w1Inputs').innerHTML = getWeekInputs('w1');
  document.getElementById('w2Inputs').innerHTML = getWeekInputs('w2');
  setTimeout(() => {
    document.querySelectorAll('#modal input[type=number]').forEach(input => {
      input.addEventListener('input', updateModalTotals);
    });
    updateModalTotals(); // trigger once initially
  }, 100);
}

function closeModal() {
  document.getElementById('modal').style.display = 'none';
}

function getWeekInputs(week) {
  return ['Regular', 'Tip', 'Extras'].map(type =>
    `<div class="flex space-x-2 mb-2">
      <input type="number" placeholder="${type} Hrs" id="${week}_${type}_hrs" class="w-16 border p-1 rounded text-right" />
      <input type="number" placeholder="Rate" id="${week}_${type}_rate" class="w-16 border p-1 rounded text-right" />
      <input type="text" id="${week}_${type}_total" class="w-20 border p-1 rounded text-right font-bold bg-gray-100" readonly value="$0.00" />
    </div>`
  ).join('');
}

function updateModalTotals() {
  let reg = 0, tip = 0, ext = 0;
  let week1Total = 0;
  let week2Total = 0;

  ['w1', 'w2'].forEach(week => {
    let total = 0;
    ['Regular', 'Tip', 'Extras'].forEach(type => {
      const h = +document.getElementById(`${week}_${type}_hrs`).value || 0;
      const r = +document.getElementById(`${week}_${type}_rate`).value || 0;
      const subtotal = h * r;
      total += subtotal;
      document.getElementById(`${week}_${type}_total`).value = `$${subtotal.toFixed(2)}`;
      if (type === 'Regular') reg += subtotal;
      if (type === 'Tip') tip += subtotal;
      if (type === 'Extras') ext += subtotal;
    });
    if (week === 'w1') {
      week1Total = total;
      document.getElementById("w1_week_total").value = `$${total.toFixed(2)}`;
    } else {
      week2Total = total;
      document.getElementById("w2_week_total").value = `$${total.toFixed(2)}`;
    }
  });

  document.getElementById("combined_regular_total").value = `$${reg.toFixed(2)}`;
  document.getElementById("combined_tip_total").value = `$${tip.toFixed(2)}`;
  document.getElementById("combined_extras_total").value = `$${ext.toFixed(2)}`;
  document.getElementById("grand_total_display").value = `$${(reg + tip + ext).toFixed(2)}`;
}

function savePayroll() {
  const tf = document.getElementById('timeFrame').value;
  let p = { time: tf, w1: {}, w2: {}, total: 0 };
  ['w1', 'w2'].forEach(w => {
    let sum = 0;
    ['Regular', 'Tip', 'Extras'].forEach(type => {
      const h = +document.getElementById(`${w}_${type}_hrs`).value || 0;
      const r = +document.getElementById(`${w}_${type}_rate`).value || 0;
      const t = h * r;
      sum += t;
      p[w][type] = { h, r, t };
    });
    p[w].total = sum;
    p.total += sum;
  });
  payrolls.push(p);
  localStorage.setItem('payrolls', JSON.stringify(payrolls));
  closeModal();
  renderPayrollList();
}

function renderPayrollList() {
  const container = document.getElementById('payrollList');
  container.innerHTML = '';
  payrolls.forEach((p, i) => {
    const div = document.createElement('div');
    div.className = 'bg-white p-2 rounded shadow';
    div.innerHTML = `
      <div class="font-bold cursor-pointer text-blue-700 hover:underline" onclick="viewPayroll(${i})">${p.time} - $${(p.total || 0).toFixed(2)}</div>
      <div class="text-right space-x-2">
        <button onclick="editPayroll(${i})" class="text-blue-500 text-sm mr-2">Edit</button>
         <button onclick="deletePayroll(${i})" class="text-red-500 text-sm">Delete</button>
      </div>`;
    container.appendChild(div);
  });
}

function deletePayroll(i) {
  payrolls.splice(i, 1);
  localStorage.setItem('payrolls', JSON.stringify(payrolls));
  renderPayrollList();
}

function drawChart() {
  const ctx = document.getElementById('payrollChart').getContext('2d');
  const labels = payrolls.map(p => p.time);
  const dataTypes = ['Regular', 'Tip', 'Extras', 'Total'];
  const datasets = dataTypes.map(type => {
    return {
      label: type,
      data: payrolls.map(p =>
        type === 'Total' ? (p.total || 0) :
        ((p.w1?.[type]?.t || 0) + (p.w2?.[type]?.t || 0))),
      borderWidth: 2,
      fill: false
    };
  });
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        font: { size: 14, family: 'Segoe UI' },
        padding: 16
      }
    },
    title: {
      display: true,
      text: 'Payroll Earnings Overview',
      font: { size: 18, family: 'Segoe UI', weight: 'bold' },
      padding: { top: 10, bottom: 20 }
    },
    tooltip: {
      backgroundColor: '#f3f4f6',
      titleColor: '#111827',
      bodyColor: '#111827',
      borderColor: '#d1d5db',
      borderWidth: 1
    }
  },
  scales: {
    x: {
      ticks: {
        font: { size: 13, family: 'Segoe UI' }
      }
    },
    y: {
      beginAtZero: true,
      ticks: {
        font: { size: 13, family: 'Segoe UI' }
      }
    }
  }
}
  });
}

function toggleDataset(label) {
  chart.data.datasets.forEach(d => {
    if (d.label === label) d.hidden = !d.hidden;
  });
  chart.update();
}

renderPayrollList();

function editPayroll(index) {
  const p = payrolls[index];
  openModal();
  document.getElementById('timeFrame').value = p.time;
  ['w1', 'w2'].forEach(week => {
    ['Regular', 'Tip', 'Extras'].forEach(type => {
      document.getElementById(`${week}_${type}_hrs`).value = p[week][type].h;
      document.getElementById(`${week}_${type}_rate`).value = p[week][type].r;
    });
  });
  updateModalTotals();
  document.querySelector("button.bg-green-500").onclick = function () {
    const tf = document.getElementById('timeFrame').value;
    let updated = { time: tf, w1: {}, w2: {}, total: 0 };
    ['w1', 'w2'].forEach(w => {
      let sum = 0;
      ['Regular', 'Tip', 'Extras'].forEach(type => {
        const h = +document.getElementById(`${w}_${type}_hrs`).value || 0;
        const r = +document.getElementById(`${w}_${type}_rate`).value || 0;
        const t = h * r;
        sum += t;
        updated[w][type] = { h, r, t };
      });
      updated[w].total = sum;
      updated.total += sum;
    });
    payrolls[index] = updated;
    localStorage.setItem('payrolls', JSON.stringify(payrolls));
    closeModal();
    renderPayrollList();
  };
}

function viewPayroll(index) {
  const p = payrolls[index];
  let msg = `📅 ${p.time}\n\n`;
  ['w1', 'w2'].forEach(week => {
    msg += week.toUpperCase() + "\n";
    ['Regular', 'Tip', 'Extras'].forEach(type => {
      const t = p[week][type];
      msg += `${type}: ${t.h} hrs × $${t.r} = $${t.t.toFixed(2)}\n`;
    });
    msg += `Total: $${p[week].total.toFixed(2)}\n\n`;
  });
  msg += `Regular Total: $${((p.w1['Regular']?.t || 0) + (p.w2['Regular']?.t || 0)).toFixed(2)}\n`;
msg += `Tip Total: $${((p.w1['Tip']?.t || 0) + (p.w2['Tip']?.t || 0)).toFixed(2)}\n`;
msg += `Extras Total: $${((p.w1['Extras']?.t || 0) + (p.w2['Extras']?.t || 0)).toFixed(2)}\n`;
msg += `\nGrand Total: $${p.total.toFixed(2)}`;
  alert(msg);
}
