const STORAGE_KEY = 'smashrank-data-v1';

const defaultData = { players: [], matches: [], teams: [] };
const FIGHTERS = [
	['Banjo & Kazooie', 'banjo_kazooie.png'], ['Bayonetta', 'bayonetta.png'], ['Bowser', 'bowser.png'], ['Bowser Jr.', 'bowser_jr.png'], ['Byleth', 'byleth.png'], ['Captain Falcon', 'captain_falcon.png'], ['Chrom', 'chrom.png'], ['Cloud', 'cloud.png'], ['Corrin', 'corrin.png'], ['Daisy', 'daisy.png'], ['Dark Pit', 'dark_pit.png'], ['Dark Samus', 'dark_samus.png'], ['Diddy Kong', 'diddy_kong.png'], ['Donkey Kong', 'donkey_kong.png'], ['Dr. Mario', 'dr_mario.png'], ['Duck Hunt', 'duck_hunt.png'], ['Falco', 'falco.png'], ['Fox', 'fox.png'], ['Ganondorf', 'ganondorf.png'], ['Greninja', 'greninja.png'], ['Hero', 'hero.png'], ['Ice Climbers', 'ice_climbers.png'], ['Incineroar', 'incineroar.png'], ['Inkling', 'inkling.png'], ['Isabelle', 'issabelle.png'], ['Jigglypuff', 'jigglypuff.png'], ['Joker', 'joker.png'], ['Kazuya', 'kazuyo.png'], ['Ken', 'ken.png'], ['King Dedede', 'king_dedede.png'], ['King K. Rool', 'king_k_rool.png'], ['Kirby', 'kirby.png'], ['Link', 'link.png'], ['Little Mac', 'little_mac.png'], ['Lucario', 'lucario.png'], ['Lucas', 'lucas.png'], ['Lucina', 'lucina.png'], ['Luigi', 'luigi.png'], ['Mario', 'mario.png'], ['Marth', 'marth.png'], ['Mega Man', 'mega_man.png'], ['Meta Knight', 'meta_knight.png'], ['Mewtwo', 'mewtwo.png'], ['Mii Brawler', 'mii_brawler.png'], ['Mii Gunner', 'mii_gunner.png'], ['Mii Swordfighter', 'mii_swordfighter.png'], ['Min Min', 'min_min.png'], ['Mr. Game & Watch', 'mr_game_and_watch.png'], ['Ness', 'ness.png'], ['Olimar', 'olimar.png'], ['Pac-Man', 'pacman.png'], ['Palutena', 'palutena.png'], ['Peach', 'peach.png'], ['Pichu', 'pichu.png'], ['Pikachu', 'pikachu.png'], ['Piranha Plant', 'pirahnna_plant.png'], ['Pit', 'pit.png'], ['Pokémon Trainer', 'pokemon_trainer.png'], ['Pyra / Mythra', 'pyra_mythra.png'], ['R.O.B.', 'rob.png'], ['Richter', 'richter.png'], ['Ridley', 'ridly.png'], ['Robin', 'robin.png'], ['Rosalina & Luma', 'rosalina.png'], ['Roy', 'roy.png'], ['Ryu', 'ryu.png'], ['Samus', 'samus.png'], ['Sephiroth', 'sephiroth.png'], ['Sheik', 'sheik.png'], ['Shulk', 'shulk.png'], ['Simon', 'simon.png'], ['Snake', 'snake.png'], ['Sonic', 'sonic.png'], ['Sora', 'sora.png'], ['Steve', 'steve.png'], ['Terry', 'terry.png'], ['Toon Link', 'toon_link.png'], ['Villager', 'villager.png'], ['Wario', 'wario.png'], ['Wii Fit Trainer', 'wii_fit_trainer.png'], ['Wolf', 'wolf.png'], ['Yoshi', 'yoshi.png'], ['Young Link', 'young_link.png'], ['Zelda', 'zelda.png'], ['Zero Suit Samus', 'zero_suit_samus.png']
].map(([name, image]) => ({ name, image }));
const state = loadState();
const playerDialog = document.querySelector('#player-dialog');
const playerForm = document.querySelector('#player-form');
const playerNameInput = document.querySelector('#player-name-input');
const playerError = document.querySelector('#player-error');
const matchForm = document.querySelector('#match-form');
const winnerSelect = document.querySelector('#winner-select');
const loserSelect = document.querySelector('#loser-select');
const teamSelect = document.querySelector('#player-team-select');
const teamsDialog = document.querySelector('#teams-dialog');
const teamForm = document.querySelector('#team-form');
const teamNameInput = document.querySelector('#team-name-input');
const teamError = document.querySelector('#team-error');
const toast = document.querySelector('#toast');
let toastTimer;

function loadState() {
	try {
		const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
		if (stored && Array.isArray(stored.players) && Array.isArray(stored.matches)) {
			return {
				players: stored.players.filter((player) => player && typeof player.id === 'string' && typeof player.name === 'string'),
				matches: stored.matches.filter((match) => match && typeof match.id === 'string' && typeof match.winnerId === 'string' && typeof match.loserId === 'string'),
				teams: Array.isArray(stored.teams) ? stored.teams.filter((team) => team && typeof team.id === 'string' && typeof team.name === 'string') : []
			};
		}
	} catch (error) {
		console.warn('Could not load saved Smash Rankings data.', error);
	}
	return { players: [...defaultData.players], matches: [...defaultData.matches] };
}

function saveState() {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
		document.querySelector('.saved-status').innerHTML = '<span class="status-dot"></span> All changes saved';
	} catch (error) {
		document.querySelector('.saved-status').innerHTML = '<span class="status-dot" style="background:#d49b41"></span> Could not save';
		console.warn('Could not save Smash Rankings data.', error);
	}
}

function escapeHtml(value) {
	return String(value).replace(/[&<>"']/g, (character) => ({
		'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
	})[character]);
}

function createId() {
	if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
	return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function getStats() {
	const stats = new Map(state.players.map((player) => [player.id, { wins: 0, losses: 0 }]));
	state.matches.forEach((match) => {
		const winner = stats.get(match.winnerId);
		const loser = stats.get(match.loserId);
		if (winner && loser) {
			winner.wins += 1;
			loser.losses += 1;
		}
	});
	return stats;
}

function getRankedPlayers(stats = getStats()) {
	return [...state.players].sort((first, second) => {
		const firstRecord = stats.get(first.id) || { wins: 0, losses: 0 };
		const secondRecord = stats.get(second.id) || { wins: 0, losses: 0 };
		const firstRatio = firstRecord.losses === 0 ? (firstRecord.wins > 0 ? Infinity : 0) : firstRecord.wins / firstRecord.losses;
		const secondRatio = secondRecord.losses === 0 ? (secondRecord.wins > 0 ? Infinity : 0) : secondRecord.wins / secondRecord.losses;
		return secondRatio - firstRatio || secondRecord.wins - firstRecord.wins || first.name.localeCompare(second.name);
	});
}

function ratioLabel(wins, losses) {
	if (losses === 0) return wins > 0 ? '∞' : '—';
	return (wins / losses).toFixed(2);
}

function playerById(id) {
	return state.players.find((player) => player.id === id);
}

function teamById(id) {
	return state.teams.find((team) => team.id === id);
}

function fighterByName(name) {
	return FIGHTERS.find((fighter) => fighter.name === name);
}

function fighterImageMarkup(name, className = 'fighter-thumb') {
	const fighter = fighterByName(name);
	if (!fighter || !fighter.image) return '';
	const loading = className === 'fighter-preview-image' ? 'eager' : 'lazy';
	return `<img class="${className}" src="images/characters/${fighter.image}" alt="${escapeHtml(fighter.name)}" loading="${loading}">`;
}

function setupFighterSelects() {
	document.querySelectorAll('.fighter-character').forEach((select) => {
		select.dataset.defaultOption = select.innerHTML;
		select.insertAdjacentHTML('beforeend', fighterOptionsMarkup(FIGHTERS));
		select.addEventListener('change', () => updateFighterPreview(select));
	});
	document.querySelectorAll('.fighter-search').forEach((search) => {
		const select = document.querySelector(`#${search.dataset.fighterSelect}`);
		search.addEventListener('input', () => filterFighterOptions(search, select));
		search.addEventListener('keydown', (event) => {
			if (event.key !== 'Enter') return;
			const normalizedQuery = search.value.trim().toLocaleLowerCase();
			const exactMatch = FIGHTERS.find((fighter) => fighter.name.toLocaleLowerCase() === normalizedQuery);
			const matches = getFilteredFighters(normalizedQuery);
			const match = exactMatch || (matches.length === 1 ? matches[0] : null);
			if (!match) return;
			event.preventDefault();
			select.value = match.name;
			updateFighterPreview(select);
		});
	});
}

function fighterOptionsMarkup(fighters) {
	return fighters.map((fighter) => `<option value="${escapeHtml(fighter.name)}">${escapeHtml(fighter.name)}</option>`).join('');
}

function getFilteredFighters(query) {
	return query ? FIGHTERS.filter((fighter) => fighter.name.toLocaleLowerCase().includes(query)) : FIGHTERS;
}

function filterFighterOptions(search, select) {
	const query = search.value.trim().toLocaleLowerCase();
	const matches = getFilteredFighters(query);
	const previousValue = select.value;
	select.innerHTML = `${select.dataset.defaultOption}${fighterOptionsMarkup(matches)}`;
	if (matches.some((fighter) => fighter.name === previousValue)) {
		select.value = previousValue;
	} else if (previousValue) {
		select.value = '';
		updateFighterPreview(select);
	}
}

function updateFighterPreview(select) {
	const preview = document.querySelector(`#${select.id.replace('-character', '-fighter-preview')}`);
	const fighter = fighterByName(select.value);
	if (fighter?.image) preview.innerHTML = fighterImageMarkup(fighter.name, 'fighter-preview-image');
	else preview.innerHTML = `<span>${fighter ? 'ART N/A' : '?'}</span>`;
}

function avatarMarkup(name, index = 0) {
	const colors = ['', ' color-1', ' color-2', ' color-3'];
	return `<span class="mini-avatar${colors[index % colors.length]}">${escapeHtml(name.trim().charAt(0).toUpperCase())}</span>`;
}

function matchPlayerMarkup(player, index, character, stocks) {
	const details = [];
	if (character) details.push(escapeHtml(character));
	if (stocks !== '' && stocks !== null && stocks !== undefined) {
		const count = Number(stocks);
		details.push(`${count} ${count === 1 ? 'stock' : 'stocks'} taken`);
	}
	return `<span class="player-chip">${avatarMarkup(player.name, index)}<span class="player-copy"><span class="player-name-text">${escapeHtml(player.name)}</span>${details.length ? `<span class="match-detail">${details.join(' · ')}</span>` : ''}</span>${character ? fighterImageMarkup(character, 'history-fighter') : ''}</span>`;
}

function formatDate(timestamp) {
	return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(timestamp));
}

function renderSelects() {
	const previousWinner = winnerSelect.value;
	const previousLoser = loserSelect.value;
	const options = state.players.map((player) => `<option value="${escapeHtml(player.id)}">${escapeHtml(player.name)}</option>`).join('');
	winnerSelect.innerHTML = `<option value="">Choose player…</option>${options}`;
	loserSelect.innerHTML = `<option value="">Choose player…</option>${options}`;
	if (state.players.some((player) => player.id === previousWinner)) winnerSelect.value = previousWinner;
	if (state.players.some((player) => player.id === previousLoser)) loserSelect.value = previousLoser;
	const canPlay = state.players.length >= 2;
	winnerSelect.disabled = !canPlay;
	loserSelect.disabled = !canPlay;
	if (!canPlay) {
		winnerSelect.innerHTML = '<option value="">Add 2 players to start</option>';
		loserSelect.innerHTML = '<option value="">Add 2 players to start</option>';
	}
	updateBattleCard();
}

function updateBattleCard() {
	const winner = playerById(winnerSelect.value);
	const loser = playerById(loserSelect.value);
	const hasDistinctPlayers = Boolean(winner && loser && winner.id !== loser.id);
	const reveal = document.querySelector('#fighter-details-reveal');
	const hint = document.querySelector('#match-selection-hint');
	reveal.classList.toggle('is-visible', hasDistinctPlayers);
	reveal.setAttribute('aria-hidden', String(!hasDistinctPlayers));
	reveal.inert = !hasDistinctPlayers;
	hint.hidden = !(winner && loser && winner.id === loser.id);
	document.querySelector('#winner-fighter-owner').textContent = winner?.name || 'Winner';
	document.querySelector('#loser-fighter-owner').textContent = loser?.name || 'Loser';
	const haveStocks = document.querySelector('#winner-stocks').value !== '' && document.querySelector('#loser-stocks').value !== '';
	matchForm.querySelector('button[type="submit"]').disabled = !hasDistinctPlayers || !haveStocks;
}

function renderTeamOptions() {
	const previousTeam = teamSelect.value;
	teamSelect.innerHTML = `<option value="">No team</option>${state.teams.map((team) => `<option value="${escapeHtml(team.id)}">${escapeHtml(team.name)}</option>`).join('')}`;
	if (state.teams.some((team) => team.id === previousTeam)) teamSelect.value = previousTeam;
}

function renderTeamList() {
	const teamList = document.querySelector('#team-list');
	const assignmentsList = document.querySelector('#team-assignments');
	if (!state.teams.length) {
		teamList.innerHTML = '<li class="team-list-empty">No teams yet. Create one above to start grouping players.</li>';
	} else {
		teamList.innerHTML = state.teams.map((team) => {
			const count = state.players.filter((player) => player.teamId === team.id).length;
			return `<li><span class="team-list-name"><span class="team-badge">♟</span><span>${escapeHtml(team.name)}<small>${count} ${count === 1 ? 'player' : 'players'}</small></span></span><button type="button" class="team-remove" data-delete-team="${escapeHtml(team.id)}" aria-label="Remove team ${escapeHtml(team.name)}" title="Remove team">×</button></li>`;
		}).join('');
	}
	if (!state.players.length) {
		assignmentsList.innerHTML = '<li class="team-list-empty">Add players to assign them to teams.</li>';
		return;
	}
	assignmentsList.innerHTML = state.players.map((player) => `<li><span>${escapeHtml(player.name)}</span><select class="assignment-select" data-player-team="${escapeHtml(player.id)}" aria-label="Team for ${escapeHtml(player.name)}"><option value="">No team</option>${state.teams.map((team) => `<option value="${escapeHtml(team.id)}" ${player.teamId === team.id ? 'selected' : ''}>${escapeHtml(team.name)}</option>`).join('')}</select></li>`).join('');
}

function renderMatches() {
	const body = document.querySelector('#matches-body');
	const empty = document.querySelector('#matches-empty');
	const validMatches = state.matches.filter((match) => playerById(match.winnerId) && playerById(match.loserId));
	body.innerHTML = [...validMatches].reverse().map((match, index) => {
		const winner = playerById(match.winnerId);
		const loser = playerById(match.loserId);
		const winnerIndex = state.players.findIndex((player) => player.id === winner.id);
		const loserIndex = state.players.findIndex((player) => player.id === loser.id);
		return `<tr>
			<td class="row-number">${validMatches.length - index}</td>
			<td class="match-date">${formatDate(match.date)}</td>
			<td class="match-player">${matchPlayerMarkup(winner, winnerIndex, match.winnerCharacter, match.winnerStocks)}</td>
			<td class="match-vs">vs</td>
			<td class="match-player">${matchPlayerMarkup(loser, loserIndex, match.loserCharacter, match.loserStocks)}</td>
			<td><span class="win-tag">${escapeHtml(winner.name)} wins</span></td>
			<td><button class="row-action" type="button" data-delete-match="${escapeHtml(match.id)}" aria-label="Remove match between ${escapeHtml(winner.name)} and ${escapeHtml(loser.name)}" title="Remove match">×</button></td>
		</tr>`;
	}).join('');
	empty.hidden = validMatches.length > 0;
	document.querySelector('#match-footer-count').textContent = `${validMatches.length} ${validMatches.length === 1 ? 'match' : 'matches'}`;
	document.querySelector('#match-tab-count').textContent = String(validMatches.length);
}

function renderRankings(stats) {
	const body = document.querySelector('#rankings-body');
	const empty = document.querySelector('#rankings-empty');
	const ranked = getRankedPlayers(stats);
	const groups = [...state.teams].sort((first, second) => first.name.localeCompare(second.name)).map((team) => ({
		name: team.name,
		players: ranked.filter((player) => player.teamId === team.id)
	})).filter((group) => group.players.length);
	const unassigned = ranked.filter((player) => !teamById(player.teamId));
	if (unassigned.length) groups.push({ name: 'No team', players: unassigned });
	let displayedRank = 0;
	body.innerHTML = groups.map((group) => `<tr class="team-group-row"><th colspan="8"><span class="team-badge">♟</span>${escapeHtml(group.name)}<span class="team-member-count">${group.players.length} ${group.players.length === 1 ? 'player' : 'players'}</span></th></tr>${group.players.map((player) => {
		const index = displayedRank++;
		const record = stats.get(player.id) || { wins: 0, losses: 0 };
		const played = record.wins + record.losses;
		const winRate = played > 0 ? Math.round((record.wins / played) * 100) : 0;
		return `<tr class="${index === 0 && played > 0 ? 'rank-first-row' : ''}">
			<td class="row-number">${index + 1}</td>
			<td class="rank-cell ${index === 0 && played > 0 ? 'rank-first' : ''}">${String(index + 1).padStart(2, '0')}</td>
			<td class="player-name-cell">${avatarMarkup(player.name, index)}${escapeHtml(player.name)}</td>
			<td class="numeric-cell">${record.wins}</td>
			<td class="numeric-cell">${record.losses}</td>
			<td><span class="win-rate-wrap"><span class="rate-track"><span class="rate-fill" style="display:block;width:${winRate}%"></span></span><span class="win-rate-number">${played ? `${winRate}%` : '—'}</span></span></td>
			<td class="ratio-cell">${ratioLabel(record.wins, record.losses)}</td>
			<td><button class="row-action" type="button" data-delete-player="${escapeHtml(player.id)}" aria-label="Remove ${escapeHtml(player.name)}" title="Remove player">×</button></td>
		</tr>`;
	}).join('')}`).join('');
	empty.hidden = ranked.length > 0;
	document.querySelector('#ranking-footer-count').textContent = `${ranked.length} ${ranked.length === 1 ? 'player' : 'players'}`;
	document.querySelector('#ranking-tab-count').textContent = String(ranked.length);
}

function render() {
	const stats = getStats();
	const ranked = getRankedPlayers(stats);
	const leader = ranked.find((player) => {
		const record = stats.get(player.id);
		return record && record.wins + record.losses > 0;
	});
	const leaderStats = leader ? stats.get(leader.id) : null;
	document.querySelector('#total-players').textContent = String(state.players.length);
	document.querySelector('#total-matches').textContent = String(state.matches.filter((match) => playerById(match.winnerId) && playerById(match.loserId)).length);
	document.querySelector('#top-player-name').textContent = leader ? leader.name : '—';
	document.querySelector('#top-player-record').textContent = leaderStats ? `${leaderStats.wins}W – ${leaderStats.losses}L · ${ratioLabel(leaderStats.wins, leaderStats.losses)} ratio` : 'Waiting for the first match';
	document.querySelector('#top-player-ratio').textContent = leaderStats ? ratioLabel(leaderStats.wins, leaderStats.losses) : '—';
	renderSelects();
	renderTeamOptions();
	renderTeamList();
	renderMatches();
	renderRankings(stats);
	saveState();
}

function showToast(message) {
	toast.textContent = message;
	toast.classList.add('show');
	clearTimeout(toastTimer);
	toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
}

function openPlayerDialog() {
	playerError.textContent = '';
	playerForm.reset();
	renderTeamOptions();
	playerDialog.showModal();
	requestAnimationFrame(() => playerNameInput.focus());
}

function switchTab(tabName) {
	document.querySelectorAll('.sheet-tab').forEach((tab) => {
		const active = tab.dataset.tab === tabName;
		tab.classList.toggle('active', active);
		tab.setAttribute('aria-selected', String(active));
	});
	document.querySelector('#panel-matches').hidden = tabName !== 'matches';
	document.querySelector('#panel-rankings').hidden = tabName !== 'rankings';
}

document.querySelector('#add-player-button').addEventListener('click', openPlayerDialog);
document.querySelector('[data-open-add]').addEventListener('click', openPlayerDialog);
document.querySelector('#manage-teams-button').addEventListener('click', () => {
	teamError.textContent = '';
	renderTeamList();
	teamsDialog.showModal();
	requestAnimationFrame(() => teamNameInput.focus());
});
document.querySelector('#close-teams').addEventListener('click', () => teamsDialog.close());
document.querySelector('#cancel-player').addEventListener('click', () => playerDialog.close());
document.querySelector('.dialog-close').addEventListener('click', () => playerDialog.close());
teamsDialog.querySelector('.dialog-close').addEventListener('click', () => teamsDialog.close());

playerForm.addEventListener('submit', (event) => {
	event.preventDefault();
	const name = playerNameInput.value.trim();
	if (!name) {
		playerError.textContent = 'Enter a player name to continue.';
		playerNameInput.focus();
		return;
	}
	if (state.players.some((player) => player.name.toLocaleLowerCase() === name.toLocaleLowerCase())) {
		playerError.textContent = 'That player is already in your roster.';
		playerNameInput.focus();
		return;
	}
	state.players.push({ id: createId(), name, teamId: teamSelect.value || null });
	render();
	playerDialog.close();
	showToast(`${name} added to your roster`);
});

matchForm.addEventListener('submit', (event) => {
	event.preventDefault();
	const winnerId = winnerSelect.value;
	const loserId = loserSelect.value;
	if (!winnerId || !loserId) return;
	if (winnerId === loserId) {
		showToast('Choose two different players for a match');
		return;
	}
	const winnerCharacter = document.querySelector('#winner-character').value.trim();
	const loserCharacter = document.querySelector('#loser-character').value.trim();
	const winnerStocks = document.querySelector('#winner-stocks').value;
	const loserStocks = document.querySelector('#loser-stocks').value;
	if (winnerStocks === '' || loserStocks === '') {
		showToast('Select stocks taken for both players');
		return;
	}
	state.matches.push({ id: createId(), winnerId, loserId, date: new Date().toISOString(), winnerCharacter, loserCharacter, winnerStocks, loserStocks });
	render();
	winnerSelect.value = '';
	loserSelect.value = '';
	matchForm.querySelectorAll('.fighter-character, .fighter-stocks').forEach((field) => { field.value = ''; });
	matchForm.querySelectorAll('.fighter-search').forEach((search) => {
		search.value = '';
		filterFighterOptions(search, document.querySelector(`#${search.dataset.fighterSelect}`));
	});
	matchForm.querySelectorAll('.fighter-art-preview').forEach((preview) => { preview.innerHTML = '<span>?</span>'; });
	updateBattleCard();
	showToast('Match recorded — rankings updated');
});

winnerSelect.addEventListener('change', updateBattleCard);
loserSelect.addEventListener('change', updateBattleCard);
document.querySelectorAll('.fighter-stocks').forEach((select) => select.addEventListener('change', updateBattleCard));
document.querySelectorAll('.sheet-tab').forEach((tab) => tab.addEventListener('click', () => switchTab(tab.dataset.tab)));
document.querySelector('[data-switch-tab="matches"]').addEventListener('click', () => switchTab('matches'));

teamForm.addEventListener('submit', (event) => {
	event.preventDefault();
	const name = teamNameInput.value.trim();
	if (!name) {
		teamError.textContent = 'Enter a team name to continue.';
		teamNameInput.focus();
		return;
	}
	if (state.teams.some((team) => team.name.toLocaleLowerCase() === name.toLocaleLowerCase())) {
		teamError.textContent = 'A team with that name already exists.';
		teamNameInput.focus();
		return;
	}
	state.teams.push({ id: createId(), name });
	teamNameInput.value = '';
	teamError.textContent = '';
	render();
	showToast(`${name} team created`);
	teamNameInput.focus();
});

document.addEventListener('click', (event) => {
	const deleteTeamButton = event.target.closest('[data-delete-team]');
	if (deleteTeamButton) {
		const team = teamById(deleteTeamButton.dataset.deleteTeam);
		if (!team) return;
		state.players.forEach((player) => {
			if (player.teamId === team.id) player.teamId = null;
		});
		state.teams = state.teams.filter((item) => item.id !== team.id);
		render();
		showToast(`${team.name} removed; its players are now unassigned`);
		return;
	}
	const deleteMatchButton = event.target.closest('[data-delete-match]');
	if (deleteMatchButton) {
		state.matches = state.matches.filter((match) => match.id !== deleteMatchButton.dataset.deleteMatch);
		render();
		showToast('Match removed and rankings recalculated');
		return;
	}
	const deletePlayerButton = event.target.closest('[data-delete-player]');
	if (deletePlayerButton) {
		const player = playerById(deletePlayerButton.dataset.deletePlayer);
		if (!player) return;
		const relatedMatches = state.matches.filter((match) => match.winnerId === player.id || match.loserId === player.id).length;
		const message = relatedMatches > 0
			? `Remove ${player.name} and their ${relatedMatches} recorded ${relatedMatches === 1 ? 'match' : 'matches'}? This cannot be undone.`
			: `Remove ${player.name} from your roster?`;
		if (!window.confirm(message)) return;
		state.players = state.players.filter((item) => item.id !== player.id);
		state.matches = state.matches.filter((match) => match.winnerId !== player.id && match.loserId !== player.id);
		render();
		showToast(`${player.name} removed from your roster`);
	}
});

document.addEventListener('change', (event) => {
	const assignment = event.target.closest('[data-player-team]');
	if (!assignment) return;
	const player = playerById(assignment.dataset.playerTeam);
	if (!player) return;
	player.teamId = assignment.value || null;
	render();
	showToast(`${player.name} team assignment updated`);
});

document.querySelector('#export-button').addEventListener('click', () => {
	if (state.players.length === 0) {
		showToast('Add players before exporting rankings');
		return;
	}
	const stats = getStats();
	const rows = [['Rank', 'Player', 'Team', 'Wins', 'Losses', 'Win Rate', 'W/L Ratio']];
	getRankedPlayers(stats).forEach((player, index) => {
		const record = stats.get(player.id);
		const played = record.wins + record.losses;
		rows.push([index + 1, player.name, teamById(player.teamId)?.name || '', record.wins, record.losses, played ? `${Math.round(record.wins / played * 100)}%` : '—', ratioLabel(record.wins, record.losses)]);
	});
	const csv = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
	const link = document.createElement('a');
	link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
	link.download = 'smash-rankings.csv';
	link.click();
	URL.revokeObjectURL(link.href);
	showToast('Rankings exported as CSV');
});

setupFighterSelects();
render();
