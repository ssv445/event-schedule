class FairSchedule {
    constructor() {
        this.events = [];
        this.isAdmin = new URLSearchParams(window.location.search).get('mode') === 'admin';
        this.init();
    }

    async init() {
        try {
            // In real app, replace with actual API endpoint
            const response = await $.getJSON('events.json');
            this.events = response;
            this.render();
            this.setupSearch();
            
            // Update status every minute
            setInterval(() => this.updateEventStatus(), 60000);
        } catch (error) {
            console.error('Failed to load events:', error);
        }
    }

    isCurrentDay(date) {
        const today = new Date().toISOString().split('T')[0];
        return date === today;
    }

    isEventLive(event) {
        const now = new Date();
        const startTime = new Date(`${event.date} ${event.timeStart}`);
        const endTime = new Date(`${event.date} ${event.timeEnd}`);
        return now >= startTime && now <= endTime;
    }

    isEventPast(event) {
        const now = new Date();
        const endTime = new Date(`${event.date} ${event.timeEnd}`);
        return now > endTime;
    }

    createEventCard(event) {
        const isLive = this.isEventLive(event);
        const isPast = this.isEventPast(event);
        const isToday = this.isCurrentDay(event.date);

        const cardClasses = [
            'event-card',
            'col-12',
            'mb-3',
            isLive ? 'current' : '',
            isPast ? 'past' : '',
            isToday ? 'current-day' : ''
        ].filter(Boolean).join(' ');

        const renderPeople = (people, role) => {
            if (!people || !people.length) return '';
            
            const namesList = people.map(p => p.name).join(', ');
            const phonesList = this.isAdmin ? people.map(p => 
                `<a href="tel:${p.phone}">${p.phone}</a>`
            ).join(', ') : '';

            return `
                <div class="people-group">
                    <span class="role">${role}:</span> ${namesList}
                    ${phonesList ? `<div class="phone-number"><small>${phonesList}</small></div>` : ''}
                </div>
            `;
        };

        return `
            <div class="${cardClasses}">
                <div class="card position-relative">
                    ${isLive ? '<span class="live-badge">Now Live!</span>' : ''}
                    <div class="card-body">
                        <h5 class="card-title">${event.programmeName}</h5>
                        <h6 class="card-subtitle mb-2 text-muted">
                            ${event.date} | ${event.timeStart} - ${event.timeEnd}
                        </h6>
                        <p class="card-text">
                            ${event.programmeDetail1}<br>
                            ${event.programmeDetail2 || ''}
                        </p>
                        <div class="details">
                            <small>
                                Audience: ${event.audienceType}<br>
                                ${renderPeople(event.participants, 'Participants')}
                                ${renderPeople(event.organizers, 'Organizers')}
                                ${renderPeople(event.coordinators, 'Coordinators')}
                                ${renderPeople(event.volunteers, 'Volunteers')}
                                Sponsor: ${event.sponsorName}<br>
                                Snacks: ${event.snacksName} (${event.snacksCount} pax)
                            </small>
                            ${this.isAdmin ? `
                                <div class="phone-number">
                                    <small>
                                        Sponsor: <a href="tel:${event.sponsorPhone}">${event.sponsorPhone}</a><br>
                                        Snacks: <a href="tel:${event.snacksPhone}">${event.snacksPhone}</a>
                                    </small>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    render() {
        const container = $('#eventsList');
        container.empty();
        
        if (this.isAdmin) {
            document.body.classList.add('admin');
        }

        this.events.forEach(event => {
            container.append(this.createEventCard(event));
        });
    }

    setupSearch() {
        $('#searchInput').on('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            $('.event-card').each((_, card) => {
                const content = $(card).text().toLowerCase();
                $(card).toggle(content.includes(searchTerm));
            });
        });
    }

    updateEventStatus() {
        this.render();
    }
}

// Initialize when document is ready
$(document).ready(() => {
    new FairSchedule();
}); 