document.addEventListener('DOMContentLoaded', function() {
    // Use buttons to toggle between views
    document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
    document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
    document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
    document.querySelector('#compose').addEventListener('click', compose_email);

    // Send email
    document.querySelector("#compose-form").addEventListener('submit', send_email);

    // By default, load the inbox
    load_mailbox('inbox'); 
});

function compose_email(email) {
    // Show compose view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#view-mail').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';

    // Clear out composition fields
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';
    
}

function load_mailbox(mailbox) {
    // Show the mailbox and hide other views
    document.querySelector('#emails-view').style.display = 'block';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#view-mail').style.display = 'none'; 

    // Show the mailbox name
    document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

    fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
        emails.forEach(email => {
            const emailDiv = document.createElement('div');
            emailDiv.classList.add('card', 'mb-3');
            emailDiv.innerHTML = `
                <div class="card-body">
                    <p><strong>From:</strong> ${email.sender}</p>
                    <p><strong>Subject:</strong> ${email.subject}</p>
                    <p><strong>Timestamp:</strong> ${email.timestamp}</p>
                </div>
            `;
            if (mailbox !== 'sent') {
                if(email.read){
                    emailDiv.style.backgroundColor = '#f0f0f0';
                }
                let element = document.createElement('button');
                element.innerHTML = email.archived ? "Unarchive" : "Archive";
                const buttonDiv = document.createElement('div');
                buttonDiv.appendChild(element);
                emailDiv.querySelector('.card-body').appendChild(buttonDiv);

                element.addEventListener("click", (event) => {
                    event.stopPropagation(); 
                    fetch(`/emails/${email.id}`, {
                        method: 'PUT',
                        body: JSON.stringify({
                            archived: !email.archived
                        })
                    })
                    .then(response => {
                        if (response.ok) {
                            email.archived = !email.archived;
                            element.innerHTML = email.archived ? "Unarchive" : "Archive";
                            load_mailbox(mailbox);
                        } else {
                            console.error('Failed to update email archive status:', response.status);
                        }
                    })
                    .catch(error => {
                        console.error('Error updating email archive status:', error);
                    });
                });
            }

            emailDiv.addEventListener('click', function() {
                fetch(`emails/${email.id}`) 
                .then(response => response.json())
                .then(email => {
                    show_mail(email)
                });
            });
            document.querySelector('#emails-view').append(emailDiv);
        });
    })
    .catch(error => {
        console.error('Error loading emails:', error);
    });
}

function send_email(event) {
    event.preventDefault();
    const recipients = document.querySelector('#compose-recipients').value;
    const subject = document.querySelector('#compose-subject').value;
    const body = document.querySelector('#compose-body').value;

    fetch('/emails', {
        method: 'POST',
        body: JSON.stringify({
            recipients: recipients,
            subject: subject,
            body: body
        })
    })
    .then(response => response.json())
    .then(result => {
        console.log(result);
        load_mailbox('sent');
    });
}

function show_mail(email) {
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#view-mail').style.display = 'block';

    fetch(`/emails/${email.id}`, {
        method: 'PUT',
        body: JSON.stringify({
            read: true
        })
    })
    .then(response => {
        if (!response.ok) {
            console.error('Failed to mark email as read:', response.status);
        }
    })
    .catch(error => {
        console.error('Error marking email as read:', error);
    });

    if (!email.archived) {
        const viewMailDiv = document.querySelector('#view-mail');
        viewMailDiv.innerHTML = `
            <h2>${email.subject}</h2>
            <p><strong>From:</strong> ${email.sender}</p>
            <p><strong>To:</strong> ${email.recipients}</p>
            <p><strong>Date:</strong> ${email.timestamp}</p>
            <hr>
            <p>${email.body}</p>
        `;

        const replyButton = document.createElement('button');
        replyButton.textContent = 'Reply';
        replyButton.classList.add('btn', 'btn-sm', 'btn-outline-primary');
        replyButton.addEventListener('click', () => {
            compose_email();
            document.querySelector('#compose-recipients').value = email.sender;
            document.querySelector('#compose-subject').value = `Re: ${email.subject}`;
            document.querySelector('#compose-body').value = `On ${email.timestamp} user: ${email.sender} wrote: `;
        });
        document.querySelector('#view-mail').appendChild(replyButton);
    } 
}