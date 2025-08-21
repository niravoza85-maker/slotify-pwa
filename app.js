
const CATEGORIES = ['Libraries','Study Halls','Sports','Hobby Classes','Community Halls'];
const VENUES = [
  { id:'lib_ahm', name:'Ahmedabad Public Library', cat:'Libraries', city:'Ahmedabad', price:60, unit:'hour', rating:4.7, address:'Ellis Bridge', slots:['07:00','08:00','09:00','10:00','11:00','12:00','14:00','15:00','16:00'] },
  { id:'study_nav', name:'Navrangpura Study Hub', cat:'Study Halls', city:'Ahmedabad', price:50, unit:'hour', rating:4.5, address:'Navrangpura', slots:['06:00','07:00','08:00','09:00','18:00','19:00','20:00'] },
  { id:'sports_zydus', name:'Zydus Sports Arena (Turf)', cat:'Sports', city:'Ahmedabad', price:900, unit:'hour', rating:4.8, address:'Thaltej', slots:['06:00','07:00','08:00','19:00','20:00','21:00','22:00'] },
  { id:'hobby_alpha', name:'Alpha Chess Club', cat:'Hobby Classes', city:'Ahmedabad', price:150, unit:'hour', rating:4.6, address:'Vastrapur', slots:['10:00','11:00','12:00','16:00','17:00'] },
  { id:'hall_sig', name:'Signature Community Hall', cat:'Community Halls', city:'Ahmedabad', price:1200, unit:'hour', rating:4.2, address:'Zundal', slots:['09:00','10:00','11:00','12:00','18:00','19:00'] },
  { id:'study_sayajigunj', name:'Sayajigunj Study Lounge', cat:'Study Halls', city:'Vadodara', price:45, unit:'hour', rating:4.3, address:'Sayajigunj', slots:['06:00','07:00','08:00','09:00','17:00','18:00'] }
];

const state = {
  q:'', city:'Ahmedabad', cat:'', sheetOpen:false,
  selectedVenue:null, selectedDate:null, selectedSlot:null, payMethod:'online',
  bookings: JSON.parse(localStorage.getItem('slotify_bookings') || '[]')
};

const $ = sel => document.querySelector(sel);
const $$ = sel => [...document.querySelectorAll(sel)];

function renderChips(){
  const el = $('#chips');
  el.innerHTML = ['All', ...CATEGORIES].map(c => {
    const active = (state.cat === c) || (c==='All' && state.cat==='');
    return `<div class="chip ${active ? 'active':''}" data-cat="${c==='All'?'':c}">${c}</div>`;
  }).join('');
  $$('#chips .chip').forEach(ch => ch.onclick = () => {
    state.cat = ch.dataset.cat;
    renderList();
    renderChips();
  });
}

function renderList(){
  const list = $('#list');
  const q = state.q.toLowerCase();
  const data = VENUES.filter(v =>
    (!state.cat || v.cat===state.cat) &&
    (v.city===state.city) &&
    (v.name.toLowerCase().includes(q) || v.address.toLowerCase().includes(q))
  );
  if($('#tabBookings').classList.contains('primary')){
    renderBookings();
    return;
  }
  list.innerHTML = data.map(v => `
    <div class="card">
      <div class="venue">
        <div class="thumb"></div>
        <div style="flex:1">
          <div class="title">${v.name}</div>
          <div class="muted">${v.cat} • ${v.address} • ⭐ ${v.rating}</div>
          <div class="row">
            <div class="muted">From ₹${v.price}/${v.unit}</div>
            <button class="primary" data-id="${v.id}">Book</button>
          </div>
        </div>
      </div>
    </div>
  `).join('') || '<div class="muted">No venues found.</div>';
  $$('#list button.primary').forEach(b => b.onclick = () => openSheet(b.dataset.id));
}

function openSheet(id){
  state.selectedVenue = VENUES.find(v => v.id===id);
  $('#vName').textContent = state.selectedVenue.name;
  $('#vMeta').textContent = `${state.selectedVenue.cat} • ${state.selectedVenue.address} • ₹${state.selectedVenue.price}/${state.selectedVenue.unit}`;
  $('#date').valueAsDate = new Date();
  state.selectedDate = new Date().toISOString().slice(0,10);
  renderSlots();
  $('#price').textContent = '₹0';
  $('input[name="pay"][value="online"]').checked = true;
  state.payMethod = 'online';
  $('#sheet').classList.add('open');
  state.sheetOpen = true;
}

function renderSlots(){
  const slots = state.selectedVenue.slots;
  const grid = $('#slots');
  grid.innerHTML = slots.map(s => `<div class="slot ${state.selectedSlot===s?'sel':''}" data-s="${s}">${s}</div>`).join('');
  $$('#slots .slot').forEach(el => el.onclick = () => {
    state.selectedSlot = el.dataset.s;
    $$('#slots .slot').forEach(x => x.classList.remove('sel'));
    el.classList.add('sel');
    $('#price').textContent = `₹${state.selectedVenue.price}`;
  });
}

function closeSheet(){ $('#sheet').classList.remove('open'); state.sheetOpen=false; }
function confirmBooking(){
  if(!state.selectedVenue || !state.selectedSlot || !$('#date').value){
    alert('Please pick a date and time slot.'); return;
  }
  const booking = {
    id: 'b_' + Math.random().toString(36).slice(2,9),
    venueId: state.selectedVenue.id,
    venueName: state.selectedVenue.name,
    city: state.selectedVenue.city,
    date: $('#date').value,
    slot: state.selectedSlot,
    price: state.selectedVenue.price,
    pay: state.payMethod,
    status: 'Booked',
    createdAt: new Date().toISOString()
  };
  state.bookings.unshift(booking);
  localStorage.setItem('slotify_bookings', JSON.stringify(state.bookings));
  closeSheet();
  $('#tabBookings').click();
  alert('Booking confirmed!');
}

function renderBookings(){
  const list = $('#list');
  if(!state.bookings.length){
    list.innerHTML = '<div class="muted">No bookings yet.</div>'; return;
  }
  list.innerHTML = state.bookings.map(b => `
    <div class="card">
      <div class="row">
        <div>
          <div class="title" style="font-size:16px">${b.venueName}</div>
          <div class="muted">${b.city} • ${b.date} @ ${b.slot}</div>
          <div class="muted">₹${b.price} • ${b.pay==='online'?'Pay online':'Pay at location'}</div>
        </div>
        <div><div class="chip ${b.pay==='location'?'':'active'}">${b.status}</div></div>
      </div>
      <div class="row">
        <button class="ghost" data-id="${b.id}" data-act="cancel">Cancel</button>
        <button class="primary" data-id="${b.id}" data-act="details">Details</button>
      </div>
    </div>
  `).join('');

  $$('#list button').forEach(btn => {
    const id = btn.dataset.id;
    const act = btn.dataset.act;
    btn.onclick = () => {
      if(act==='cancel'){
        const idx = state.bookings.findIndex(x => x.id===id);
        if(idx>-1){
          state.bookings[idx].status = 'Cancelled';
          localStorage.setItem('slotify_bookings', JSON.stringify(state.bookings));
          renderBookings();
        }
      }else if(act==='details'){
        const b = state.bookings.find(x => x.id===id);
        alert(`${b.venueName}\n${b.city}\n${b.date} ${b.slot}\n₹${b.price}\nPayment: ${b.pay}`);
      }
    };
  });
}

function bind(){
  $('#q').addEventListener('input', e=>{ state.q = e.target.value; renderList(); });
  $('#city').addEventListener('change', e=>{ state.city = e.target.value; renderList(); });
  $('#closeBtn').onclick = closeSheet;
  $('#confirmBtn').onclick = confirmBooking;
  $('#date').addEventListener('change', e=>{ state.selectedDate = e.target.value; });
  $$('input[name="pay"]').forEach(r => r.onchange = e=>{ state.payMethod = e.target.value; });
  $('#tabExplore').onclick = () => { $('#tabExplore').classList.add('primary'); $('#tabBookings').classList.remove('primary'); renderList(); };
  $('#tabBookings').onclick = () => { $('#tabBookings').classList.add('primary'); $('#tabExplore').classList.remove('primary'); renderBookings(); };
}

function init(){ renderChips(); bind(); renderList(); $('#tabExplore').classList.add('primary'); }
init();
