class FairSchedule {
    constructor() {
        this.events = [];
        this.init();
    }

    async init() {
        try {
            await this.loadEvents();
            this.setupFilters();
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
                // url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRp22KQAC4hs9_NGWEOyQ8i6JyHwspWz1jTPr_uLci9LIBvj7m4-RdrN6MwKXOhW0RI0g0M09qFtJhm/pub?output=csv',
                dataType: 'text'
            });
            this.events = this.parseCSV(response);
            this.updateProgramTypeOptions();
        } catch (error) {
            console.error('Error loading events:', error);
        }
    }

    parseCSV(csv) {
        const lines = csv.split('\n');
        const headers = lines[0].split(',').map(header => header.replace(/"/g, '').trim());
        return lines.slice(1).map(line => {
            // Match CSV fields, handling quoted values with potential commas inside
            const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)
                .map(value => value.replace(/"/g, '').trim());
            return headers.reduce((obj, header, index) => {
                obj[header] = values[index] || '';
                return obj;
            }, {});
        });
    }

    setupFilters() {
        this.searchInput = $('#searchInput');
        this.programTypeFilter = $('#programTypeFilter');
        this.dateFilter = $('#dateFilter');
    }

    setupEventListeners() {
        this.searchInput.on('input', () => this.filterEvents());
        this.programTypeFilter.on('change', () => this.filterEvents());
        this.dateFilter.on('change', () => this.filterEvents());
        
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

    updateProgramTypeOptions() {
        const types = [...new Set(this.events.map(event => event.programType))];
        types.forEach(type => {
            this.programTypeFilter.append(`<option value="${type}">${type}</option>`);
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
        const programType = this.programTypeFilter.val();
        const dateFilter = this.dateFilter.val();

        this.renderEvents(this.events.filter(event => {
            const matchesSearch = Object.values(event).some(value => 
                value.toLowerCase().includes(searchTerm)
            );
            const matchesType = !programType || event.programType === programType;
            const matchesDate = !dateFilter || event.date === dateFilter;
            return matchesSearch && matchesType && matchesDate;
        }));
    }

    renderEvents(filteredEvents = this.events) {
        const container = $('#eventsList');
        container.empty();

        // Group events by date
        const eventsByDate = filteredEvents.reduce((acc, event) => {
            if (!acc[event.date]) {
                acc[event.date] = [];
            }
            acc[event.date].push(event);
            return acc;
        }, {});

        // Sort dates
        Object.keys(eventsByDate).sort().forEach(date => {
            // Add date header
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

            // Add events for this date
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
                                <div class="toggle-details">
                                    <span class="toggle-icon">▼</span>
                                    <span class="toggle-text">Show Details</span>
                                </div>
                                <div class="programme-details">
                                    <p><strong>Additional Details:</strong> ${event.programmeDetail2}</p>
                                    <p><strong>Participants:</strong> ${event.participants}</p>
                                    <p><strong>Guests:</strong> ${event.guests}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                `);
            });
        });
    }

    startTimeUpdates() {
        setInterval(() => this.renderEvents(), 60000); // Update every minute
    }
}

$(document).ready(() => {
    new FairSchedule();
}); 