/* NightNote: vanilla JavaScript + Supabase Auth/PostgreSQL.
   Add your Supabase Project URL and anon/publishable key below.
   Never put a service_role/secret key in browser code. */
const SUPABASE_URL = 'YOUR_SUPABASE_PROJECT_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_OR_PUBLISHABLE_KEY';

const hasSupabaseConfig = SUPABASE_URL.startsWith('https://') && !SUPABASE_URL.includes('YOUR_') && SUPABASE_ANON_KEY && !SUPABASE_ANON_KEY.includes('YOUR_');
const supabase = (window.supabase && hasSupabaseConfig)
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
let currentUser = null;
let notes = [];
let editingNoteId = null;
let authMode = 'login';
let toastTimer;

$('#year').textContent = new Date().getFullYear();

function showToast(message, isError = false) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.toggle('error', isError);
  toast.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add('hidden'), 3200);
}
function setFormMessage(selector, message = '', success = false) {
  const el = $(selector);
  el.textContent = message;
  el.classList.toggle('success', success);
}
function openModal(id) {
  $(id).classList.remove('hidden');
  document.body.classList.add('modal-open');
}
function closeModal(id) {
  $(id).classList.add('hidden');
  if ($$('.modal-backdrop:not(.hidden)').length === 0) document.body.classList.remove('modal-open');
}
function setAuthMode(mode) {
  authMode = mode;
  const signup = mode === 'signup';
  $('#auth-eyebrow').textContent = signup ? 'YOUR NEXT CHAPTER STARTS HERE' : 'WELCOME BACK';
  $('#auth-title').textContent = signup ? 'Make it your space.' : 'Good to have you.';
  $('#auth-subtitle').textContent = signup ? 'Create an account and give your thoughts a home.' : 'Sign in and pick up where your mind left off.';
  $('#auth-submit').innerHTML = signup ? 'Create account <span>↗</span>' : 'Log in <span>↗</span>';
  $('#switch-copy').textContent = signup ? 'Already have an account?' : 'New around here?';
  $('#switch-auth-btn').textContent = signup ? 'Log in instead' : 'Create an account';
  $('#auth-password').autocomplete = signup ? 'new-password' : 'current-password';
  setFormMessage('#auth-message');
}
function showDashboard() {
  $('#guest-actions').classList.add('hidden');
  $('#user-actions').classList.remove('hidden');
  $('#nav-user-email').textContent = currentUser?.email || 'Signed in';
  $('#dashboard').classList.remove('hidden');
  $$('.hero, .feature-section, .how-section, .cta-section').forEach(el => el.classList.add('hidden'));
  $('#welcome-text').textContent = `Signed in as ${currentUser?.email || 'you'}. Keep the good ideas coming.`;
  $('#go-dashboard').textContent = 'Your notes ✓';
  $('#dashboard').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function showLanding() {
  $('#guest-actions').classList.remove('hidden');
  $('#user-actions').classList.add('hidden');
  $('#dashboard').classList.add('hidden');
  $$('.hero, .feature-section, .how-section, .cta-section').forEach(el => el.classList.remove('hidden'));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function friendlyError(error) {
  const message = error?.message || 'Something went wrong. Please try again.';
  if (/invalid login credentials/i.test(message)) return 'Email or password is incorrect.';
  if (/user already registered/i.test(message)) return 'This email already has an account. Try logging in.';
  if (/email not confirmed/i.test(message)) return 'Please confirm your email first. Check your inbox.';
  if (/row-level security|permission denied/i.test(message)) return 'Database permissions blocked this action. Check the SQL setup in README.md.';
  return message;
}
function ensureConfigured() {
  if (!supabase) {
    setFormMessage('#auth-message', 'Setup needed: add your Supabase URL and anon/publishable key in app.js, then run the SQL in README.md.');
    return false;
  }
  return true;
}

$$('[data-open-auth]').forEach(button => button.addEventListener('click', () => {
  setAuthMode(button.dataset.openAuth);
  openModal('#auth-modal');
  setTimeout(() => $('#auth-email').focus(), 50);
}));
$$('[data-close-modal]').forEach(button => button.addEventListener('click', () => closeModal('#auth-modal')));
$$('[data-close-note]').forEach(button => button.addEventListener('click', () => closeModal('#note-modal')));
$('#auth-modal').addEventListener('click', e => { if (e.target === $('#auth-modal')) closeModal('#auth-modal'); });
$('#note-modal').addEventListener('click', e => { if (e.target === $('#note-modal')) closeModal('#note-modal'); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal('#auth-modal'); closeModal('#note-modal'); } });
$('#switch-auth-btn').addEventListener('click', () => setAuthMode(authMode === 'login' ? 'signup' : 'login'));
$('#go-dashboard').addEventListener('click', () => $('#dashboard').scrollIntoView({ behavior: 'smooth' }));

$('#auth-form').addEventListener('submit', async e => {
  e.preventDefault();
  if (!ensureConfigured()) return;
  const email = $('#auth-email').value.trim();
  const password = $('#auth-password').value;
  const button = $('#auth-submit');
  button.disabled = true;
  button.textContent = authMode === 'signup' ? 'Creating account…' : 'Logging in…';
  setFormMessage('#auth-message');
  try {
    if (authMode === 'signup') {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      if (data.session) {
        currentUser = data.user;
        closeModal('#auth-modal');
        showDashboard();
        await loadNotes();
        showToast('Account created. Welcome to NightNote!');
      } else {
        setAuthMode('login');
        setFormMessage('#auth-message', 'Account created! Check your email to confirm it, then log in.', true);
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      currentUser = data.user;
      closeModal('#auth-modal');
      showDashboard();
      await loadNotes();
      showToast('You’re back. Let’s get those thoughts down.');
    }
  } catch (error) {
    setFormMessage('#auth-message', friendlyError(error));
  } finally {
    button.disabled = false;
    button.innerHTML = authMode === 'signup' ? 'Create account <span>↗</span>' : 'Log in <span>↗</span>';
  }
});

async function loadNotes() {
  if (!supabase || !currentUser) return;
  $('#notes-grid').innerHTML = '<div class="loading-copy">Gathering your thoughts…</div>';
  try {
    const { data, error } = await supabase.from('notes').select('id,title,content,created_at,updated_at').order('updated_at', { ascending: false });
    if (error) throw error;
    notes = data || [];
    renderNotes();
  } catch (error) {
    $('#notes-grid').innerHTML = '';
    showToast(friendlyError(error), true);
  }
}
function renderNotes() {
  const query = $('#search-notes').value.trim().toLowerCase();
  const filtered = notes.filter(note => `${note.title} ${note.content}`.toLowerCase().includes(query));
  $('#notes-count').textContent = `${filtered.length} ${filtered.length === 1 ? 'note' : 'notes'}`;
  $('#notes-grid').innerHTML = '';
  $('#empty-state').classList.toggle('hidden', filtered.length !== 0);
  if (filtered.length === 0 && query) {
    $('#empty-state').classList.remove('hidden');
    $('#empty-state h3').textContent = 'No notes found.';
    $('#empty-state p').textContent = 'Try another search, or create a brand-new note.';
    $('#empty-new-note').textContent = '＋ Create a note';
  } else if (filtered.length === 0) {
    $('#empty-state h3').textContent = 'It’s a blank page. For now.';
    $('#empty-state p').textContent = 'Make your first note and give that idea somewhere to live.';
  }
  for (const note of filtered) {
    const card = document.createElement('article');
    card.className = 'note-card';
    const title = document.createElement('h3');
    title.textContent = note.title;
    const content = document.createElement('p');
    content.textContent = note.content;
    const meta = document.createElement('div');
    meta.className = 'note-meta';
    const date = document.createElement('span');
    date.textContent = `UPDATED ${new Date(note.updated_at || note.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}`;
    const actions = document.createElement('div');
    actions.className = 'note-actions';
    const edit = document.createElement('button');
    edit.type = 'button'; edit.className = 'icon-btn'; edit.textContent = 'Edit'; edit.setAttribute('aria-label', `Edit ${note.title}`);
    edit.addEventListener('click', () => openNoteEditor(note));
    const remove = document.createElement('button');
    remove.type = 'button'; remove.className = 'icon-btn delete'; remove.textContent = 'Delete'; remove.setAttribute('aria-label', `Delete ${note.title}`);
    remove.addEventListener('click', () => deleteNote(note));
    actions.append(edit, remove); meta.append(date, actions); card.append(title, content, meta); $('#notes-grid').append(card);
  }
}
$('#search-notes').addEventListener('input', renderNotes);
$('#new-note-btn').addEventListener('click', () => openNoteEditor());
$('#empty-new-note').addEventListener('click', () => openNoteEditor());
function openNoteEditor(note = null) {
  if (!currentUser) { setAuthMode('login'); openModal('#auth-modal'); return; }
  editingNoteId = note?.id || null;
  $('#note-modal-title').innerHTML = editingNoteId ? 'Edit your note<span class="gradient-text">.</span>' : 'A new note<span class="gradient-text">.</span>';
  $('#note-title').value = note?.title || '';
  $('#note-content').value = note?.content || '';
  $('#save-note-btn').innerHTML = editingNoteId ? 'Save changes <span>↗</span>' : 'Save note <span>↗</span>';
  setFormMessage('#note-message');
  openModal('#note-modal');
  setTimeout(() => $('#note-title').focus(), 50);
}
$('#note-form').addEventListener('submit', async e => {
  e.preventDefault();
  if (!supabase || !currentUser) { setFormMessage('#note-message', 'Please log in again before saving.'); return; }
  const title = $('#note-title').value.trim();
  const content = $('#note-content').value.trim();
  if (!title || !content) { setFormMessage('#note-message', 'Please fill in both the title and content.'); return; }
  const button = $('#save-note-btn');
  button.disabled = true; button.textContent = 'Saving…'; setFormMessage('#note-message');
  try {
    let result;
    if (editingNoteId) {
      result = await supabase.from('notes').update({ title, content, updated_at: new Date().toISOString() }).eq('id', editingNoteId).select().single();
    } else {
      result = await supabase.from('notes').insert({ title, content, user_id: currentUser.id }).select().single();
    }
    if (result.error) throw result.error;
    closeModal('#note-modal');
    await loadNotes();
    showToast(editingNoteId ? 'Note updated.' : 'Note saved. Nice one.');
    editingNoteId = null;
  } catch (error) {
    setFormMessage('#note-message', friendlyError(error));
  } finally {
    button.disabled = false;
    button.innerHTML = editingNoteId ? 'Save changes <span>↗</span>' : 'Save note <span>↗</span>';
  }
});
async function deleteNote(note) {
  if (!confirm(`Delete “${note.title}”? This cannot be undone.`)) return;
  try {
    const { error } = await supabase.from('notes').delete().eq('id', note.id);
    if (error) throw error;
    notes = notes.filter(item => item.id !== note.id);
    renderNotes();
    showToast('Note deleted.');
  } catch (error) { showToast(friendlyError(error), true); }
}

async function init() {
  if (!supabase) {
    console.info('NightNote is in setup mode. Add your Supabase project URL and anon/publishable key in app.js to enable auth and database features.');
    return;
  }
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    currentUser = session.user;
    showDashboard();
    await loadNotes();
  }
  supabase.auth.onAuthStateChange((_event, sessionNow) => {
    currentUser = sessionNow?.user || null;
    if (currentUser) {
      $('#nav-user-email').textContent = currentUser.email || 'Signed in';
      // Defer database work until after the auth callback returns.
      if (!$('#dashboard').classList.contains('hidden')) setTimeout(() => loadNotes(), 0);
    } else {
      notes = [];
      showLanding();
    }
  });
  // Add a sign-out control via the user menu area without cluttering the guest homepage.
  const signOut = document.createElement('button');
  signOut.className = 'btn btn-quiet'; signOut.id = 'sign-out-btn'; signOut.textContent = 'Log out';
  signOut.addEventListener('click', async () => {
    const { error } = await supabase.auth.signOut();
    if (error) showToast(friendlyError(error), true); else showToast('You’ve logged out. See you next time.');
  });
  $('#user-actions').append(signOut);
}
init();
