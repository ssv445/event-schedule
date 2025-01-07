class FairSchedule {
    constructor() {
        this.events = [];
        this.isAdminMode = new URLSearchParams(window.location.search).get('mode') === 'admin';
        this.init();
    }

    async init() {
        try {
            await this.loadEvents();
            this.setupSearch();
            this.setupEventListeners();
            this.renderEvents();
            this.startTimeUpdates();
        } catch (error) {
            console.error('Initialization error:', error);
        }
    }

    async loadEvents() {
        try {
            const response = await $.ajax({
                url: './events.csv',
                dataType: 'text'
            });
            this.events = this.parseCSV(response);
        } catch (error) {
            console.error('Error loading events:', error);
        }
    }

    parseCSV(csv) {
        const lines = csv.split('\n');
        const headers = lines[0].split(',').map(header => header.replace(/"/g, '').trim());
        return lines.slice(1).map(line => {
            const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)
                .map(value => value.replace(/"/g, '').trim());
            return headers.reduce((obj, header, index) => {
                obj[header] = values[index] || '';
                return obj;
            }, {});
        });
    }

    setupSearch() {
        this.searchInput = $('#searchInput');
    }

    setupEventListeners() {
        this.searchInput.on('input', () => this.filterEvents());
        
        $(document).on('click', '.toggle-details', function() {
            const $details = $(this).next('.programme-details');
            const $icon = $(this).find('.toggle-icon');
            const $text = $(this).find('.toggle-text');
            
            $details.toggleClass('expanded');
            if ($details.hasClass('expanded')) {
                $icon.text('▲');
                $text.text('Hide Details');
            } else {
                $icon.text('▼');
                $text.text('Show Details');
            }
        });
    }

    isEventCurrent(event) {
        const now = new Date();
        const startTime = new Date(`${event.date} ${event.timeStart}`);
        const endTime = new Date(`${event.date} ${event.timeEnd}`);
        return now >= startTime && now <= endTime;
    }

    isEventFinished(event) {
        const now = new Date();
        const endTime = new Date(`${event.date} ${event.timeEnd}`);
        return now > endTime;
    }

    filterEvents() {
        const searchTerm = this.searchInput.val().toLowerCase();

        this.renderEvents(this.events.filter(event => {
            return Object.values(event).some(value => 
                value.toLowerCase().includes(searchTerm)
            );
        }));
    }

    renderEvents(filteredEvents = this.events) {
        const container = $('#eventsList');
        container.empty();

        const eventsByDate = filteredEvents.reduce((acc, event) => {
            if (!acc[event.date]) {
                acc[event.date] = [];
            }
            acc[event.date].push(event);
            return acc;
        }, {});

        Object.keys(eventsByDate).sort().forEach(date => {
            container.append(`
                <div class="col-12">
                    <div class="date-header">${new Date(date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    })}</div>
                </div>
            `);

            eventsByDate[date].forEach(event => {
                const isCurrent = this.isEventCurrent(event);
                const isFinished = this.isEventFinished(event);

                container.append(`
                    <div class="col-12">
                        <div class="event-row ${isCurrent ? 'current' : ''} ${isFinished ? 'finished' : ''}">
                            <div class="event-time">${event.timeStart} - ${event.timeEnd}</div>
                            <div class="event-content">
                                <div class="event-header">
                                    <div class="event-main-info">
                                        <span class="event-name">${event.programmeName}</span>
                                        <div class="event-brief">${event.programmeDetail1}</div>
                                        <span class="event-type">${event.programType}</span>
                                        ${isCurrent ? '<span class="now-live">Now Live!</span>' : ''}
                                    </div>
                                </div>
                                ${this.isAdminMode ? this.renderAdminDetails(event) : this.renderPublicDetails(event)}
                            </div>
                        </div>
                    </div>
                `);
            });
        });
    }

    renderAdminDetails(event) {
        return `
            <div class="admin-details">
                <p><strong>Additional Details:</strong> ${event.programmeDetail2}</p>
                <p><strong>Participants:</strong> ${event.participants}</p>
                <p><strong>Coordinators:</strong> ${event.coordinators}</p>
                <p><strong>Volunteers:</strong> ${event.volunteers}</p>
                <p><strong>Guests:</strong> ${event.guests}</p>
            </div>
        `;
    }

    renderPublicDetails(event) {
        return `
            <div class="toggle-details">
                <span class="toggle-icon">▼</span>
                <span class="toggle-text">Show Details</span>
            </div>
            <div class="programme-details">
                <p><strong>Additional Details:</strong> ${event.programmeDetail2}</p>
                <p><strong>Guests:</strong> ${event.guests}</p>
            </div>
        `;
    }

    startTimeUpdates() {
        setInterval(() => this.renderEvents(), 60000); // Update every minute
    }
}

$(document).ready(() => {
    new FairSchedule();
}); 