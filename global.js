(() => {
  const storageKey = 'campus-missions-session-v1';
  let cfg = null;
  let session = null;
  let user = null;
  let draftId = null;
  let paypalCanCharge = false;
  const byId = id => document.getElementById(id);
  const parse = response => response.json().catch(() => ({}));
  const categoryArt = { Design:['🎨','#fff0e9'], 'Creative & media':['🎨','#fff0e9'], Tech:['💻','#e7efff'], 'Technology & data':['💻','#e7efff'], Career:['🪄','#fff5ce'], Community:['🌱','#e7f1e6'], 'Campus & community':['🌱','#e7f1e6'], 'Research & enquiry':['🔎','#f0e9ff'], 'Events & logistics':['🎟️','#fff1de'], 'Peer support':['🤝','#e7f1e6'] };
  function updateCounts() {
    byId('open-count').textContent=missions.filter(m=>!m.state).length;
    byId('remote-count').textContent=missions.filter(m=>m.scope==='remote'&&!m.state).length;
    byId('category-count').textContent=new Set(missions.filter(m=>!m.state).map(m=>m.category)).size;
  }
  const baseRender = render;
  render = function() {
    if (activeFilter!=='Remote' && activeFilter!=='Campus') { const result=baseRender(); updateCounts(); return result; }
    const scope=activeFilter; activeFilter='All'; baseRender(); activeFilter=scope;
    const cards=[...document.querySelectorAll('.mission')];
    for (const card of cards) { const mission=missions.find(m=>String(m.id)===card.dataset.id); card.hidden=!mission||mission.scope!==(scope==='Remote'?'remote':'campus'); }
    const visible=cards.filter(card=>!card.hidden).length; byId('shown-count').textContent=visible; updateCounts();
    if (!visible) byId('mission-list').innerHTML='<div class="empty">No missions in this location yet. Try another filter or post one!</div>';
  };
  for (const [label,filter] of [['Remote worldwide','Remote'],['Campus','Campus']]) {
    const button=document.createElement('button'); button.className='filter'; button.dataset.filter=filter; button.textContent=label;
    button.onclick=()=>{document.querySelectorAll('.filter').forEach(x=>x.classList.toggle('selected',x===button));activeFilter=filter;render()};
    document.querySelector('.filters').insertBefore(button,document.querySelector('.sort'));
  }
  render();

  function readSession() { try { return JSON.parse(localStorage.getItem(storageKey) || 'null'); } catch { return null; } }
  function saveSession(next) { session = next; if (next) localStorage.setItem(storageKey, JSON.stringify(next)); else localStorage.removeItem(storageKey); }
  function authHeaders() { return { apikey: cfg.key, Authorization: `Bearer ${session?.access_token || cfg.key}` }; }
  async function refreshSession() {
    if (!session?.refresh_token) return false;
    const r = await fetch(`${cfg.url}/auth/v1/token?grant_type=refresh_token`, { method:'POST', headers:{ apikey:cfg.key, 'Content-Type':'application/json' }, body:JSON.stringify({ refresh_token:session.refresh_token }) });
    const data = await parse(r); if (!r.ok) { saveSession(null); return false; }
    session = { ...data, expires_at: Math.floor(Date.now()/1000) + Number(data.expires_in || 3600) }; saveSession(session); return true;
  }
  async function db(path, options = {}, retry = true) {
    if (!cfg) throw new Error('Shared storage is not configured.');
    if (session && session.expires_at && session.expires_at < Math.floor(Date.now()/1000) + 45) await refreshSession();
    const headers = { ...authHeaders(), ...(options.body ? { 'Content-Type':'application/json' } : {}), ...(options.headers || {}) };
    const r = await fetch(`${cfg.url}${path}`, { ...options, headers });
    if (r.status === 401 && retry && session?.refresh_token && await refreshSession()) return db(path, options, false);
    const data = await parse(r); if (!r.ok) throw new Error(data.message || data.msg || data.hint || JSON.stringify(data) || 'Database request failed.'); return data;
  }
  async function loadUser() {
    user = null;
    if (session?.access_token) {
      try { const r = await fetch(`${cfg.url}/auth/v1/user`, { headers: authHeaders() }); if (r.ok) user = await r.json(); else saveSession(null); }
      catch { /* Sign-in can be retried when the connection is back. */ }
    }
    syncAccount();
  }
  function syncAccount() {
    byId('header-name').textContent = user?.email ? user.email.split('@')[0] : 'Global student';
    byId('header-sub').textContent = user ? 'Signed in · worldwide board' : (cfg ? 'Sign in to post or accept' : 'Demo board · this browser');
    byId('header-avatar').textContent = user?.email?.[0]?.toUpperCase() || '✦';
    byId('auth-open').textContent = user ? 'Account' : 'Sign in';
    byId('auth-signout').style.display = user ? 'inline-flex' : 'none';
    byId('auth-status').textContent = user ? `Signed in as ${user.email}` : '';
  }
  function showAuth(message = '') { byId('auth-status').textContent = message; byId('auth-setup-note').textContent = cfg ? 'We’ll email a one-time sign-in link. Check your inbox and spam folder.' : 'Shared sign-in needs SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY. The demo board remains available in this browser.'; byId('auth-modal').classList.add('open'); }
  function missionBody(mission, status = 'open') {
    return { title:mission.title, description:mission.description, deliverable:mission.deliverable || '', category:mission.category, scope:mission.scope, location:mission.location, reward_type:mission.rewardType, reward_amount:mission.reward, reward_currency:mission.rewardCurrency || 'USD', reward_description:mission.rewardDescription || '', skills:mission.skills || [], creator_id:user.id, creator_name:mission.creatorName || user.email?.split('@')[0] || 'Campus community', status };
  }
  function fromRow(row) {
    const art = categoryArt[row.category] || ['✦','#edf4e8'];
    return { id:row.id, title:row.title, description:row.description, deliverable:row.deliverable, category:row.category, scope:row.scope, location:row.location, rewardType:row.reward_type, reward:Number(row.reward_amount), rewardCurrency:row.reward_currency, rewardDescription:row.reward_description, skills:row.skills || [], by:row.creator_name || 'Campus community', ago:new Date(row.created_at).toLocaleDateString(undefined,{month:'short',day:'numeric'}), state:row.status==='open'?null:row.status, claimedBy:row.claimed_by, creatorId:row.creator_id, icon:art[0], color:art[1] };
  }
  async function loadBoard() {
    if (!cfg) return;
    try { const rows = await db('/rest/v1/missions?select=*&status=neq.draft&order=created_at.desc'); missions.splice(0, missions.length, ...rows.map(fromRow)); render(); byId('shown-count').textContent = missions.length; }
    catch (e) { toast(`Shared board unavailable: ${e.message}`); }
  }
  async function createMission(mission, status) {
    const rows = await db('/rest/v1/missions?select=*', { method:'POST', headers:{ Prefer:'return=representation' }, body:JSON.stringify(missionBody(mission,status)) });
    return rows[0];
  }
  async function requestSignIn(email) {
    const r = await fetch('/api/auth/magiclink', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ email }) });
    const data = await parse(r); if (!r.ok) throw new Error(data.error || 'Could not send the sign-in link.');
  }
  async function acceptMagicLink() {
    const params = new URLSearchParams(location.hash.slice(1));
    const access = params.get('access_token');
    if (!access) return;
    const next = { access_token:access, refresh_token:params.get('refresh_token'), expires_in:Number(params.get('expires_in')||3600), expires_at:Math.floor(Date.now()/1000)+Number(params.get('expires_in')||3600), token_type:params.get('token_type')||'bearer' };
    saveSession(next); history.replaceState(null,'',location.pathname+location.search);
  }
  function localDraftFromForm() {
    const isPaypal = byId('reward-mode').value === 'paypal';
    const scope = byId('scope').value;
    return { title:byId('title').value.trim(), description:byId('description').value.trim(), deliverable:byId('deliverable').value.trim(), category:byId('category').value, scope, location:scope==='remote'?'Remote · open worldwide':(byId('location').value.trim()||'Campus community'), creatorName:byId('group-name').value.trim(), rewardType:isPaypal?'paypal':'local', reward:isPaypal?Number(byId('reward').value):null, rewardCurrency:byId('currency').value, rewardDescription:isPaypal?'':byId('reward-description').value.trim(), skills:byId('skills').value.split(',').map(s=>s.trim()).filter(Boolean) };
  }

  byId('auth-open').onclick = () => showAuth();
  byId('auth-close').onclick = byId('auth-cancel').onclick = () => byId('auth-modal').classList.remove('open');
  byId('auth-modal').onclick = e => { if (e.target.id==='auth-modal') byId('auth-modal').classList.remove('open'); };
  byId('auth-form').onsubmit = async e => {
    e.preventDefault(); const button=e.submitter; button.disabled=true; button.textContent='Sending link…';
    try { await requestSignIn(byId('auth-email').value.trim()); byId('auth-status').textContent='Sign-in link sent. Open it on this device to join the shared board.'; }
    catch (error) { byId('auth-status').textContent=error.message; }
    finally { button.disabled=false; button.textContent='Email me a sign-in link'; }
  };
  byId('auth-signout').onclick = async () => { if (cfg && session?.access_token) { try { await fetch(`${cfg.url}/auth/v1/logout`,{method:'POST',headers:authHeaders()}); } catch {} } saveSession(null); user=null; syncAccount(); byId('auth-modal').classList.remove('open'); toast('Signed out.'); };

  const originalShowCheckout = showCheckout;
  showCheckout = async function() {
    if (!cfg) return originalShowCheckout();
    if (!user) { showAuth('Sign in first to post a mission to the shared worldwide board.'); return; }
    const draft = localDraftFromForm();
    if (draft.rewardType==='paypal' && !paypalCanCharge) { toast('Connect PayPal sandbox credentials before posting a cash reward. Local and non-cash rewards are available now.'); return; }
    try {
      if (draft.rewardType==='paypal') { const row=await createMission(draft,'draft'); draftId=row.id; }
      const pending = originalShowCheckout();
      if (pendingMission) { pendingMission.creatorName=draft.creatorName; if (draftId) pendingMission.globalId=draftId; }
      await pending;
    } catch (error) { draftId=null; toast(`Could not prepare mission: ${error.message}`); }
  };
  const originalPublish = publishPending;
  publishPending = async function() {
    if (!pendingMission) return;
    try {
      if (cfg) {
        if (!user) throw new Error('Your sign-in expired. Sign in again before posting.');
        if (pendingMission.globalId || draftId) await db(`/rest/v1/missions?id=eq.${encodeURIComponent(pendingMission.globalId||draftId)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({status:'open'})});
        else await createMission(pendingMission,'open');
      }
      draftId=null;
      originalPublish();
      if (cfg) await loadBoard();
    } catch (error) { toast(`Mission was not published: ${error.message}`); }
  };
  byId('detail-action').onclick = async () => {
    if (!selectedMission) return;
    if (cfg && !user) { byId('detail-modal').classList.remove('open'); showAuth('Sign in to accept a mission and keep your progress in sync.'); return; }
    const next = selectedMission.state==='accepted'?'completed':'accepted';
    if (cfg && /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(selectedMission.id)) {
      try { const change={status:next}; if(next==='accepted')change.claimed_by=user.id; const rows=await db(`/rest/v1/missions?id=eq.${encodeURIComponent(selectedMission.id)}&select=*`,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify(change)}); if(!rows.length)throw new Error('This mission has already changed. Refresh the board.'); Object.assign(selectedMission,fromRow(rows[0])); }
      catch(error){toast(`Could not update mission: ${error.message}`);return;}
    } else selectedMission.state=next;
    render(); viewMission(selectedMission.id);
    toast(next==='accepted'?'Mission accepted. You can now work on it.':'Mission marked complete. The organizer can confirm the reward.');
    if(cfg) await loadBoard();
  };

  (async () => {
    await acceptMagicLink();
    try {
      const config=await (await fetch('/api/config')).json();
      if(config.supabaseUrl&&config.supabasePublishableKey) cfg={url:config.supabaseUrl.replace(/\/$/,''),key:config.supabasePublishableKey};
      paypalCanCharge=Boolean(config.paypalReady);
      paypalClientId=paypalCanCharge?config.paypalClientId:null;
      session=readSession();
      if(cfg){await loadUser();await loadBoard();}
      else { syncAccount(); byId('auth-setup-note').textContent='Demo mode stores missions only for this browser session. Add Supabase settings to enable a shared board.'; }
    } catch { syncAccount(); }
  })();
})();
