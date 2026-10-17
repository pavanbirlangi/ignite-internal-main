import Mailsent from '../icons/Mailsent'

export function ConfirmRegisteredMail() {
    return (
        <div className="flex flex-col items-center justify-center py-6 text-center">
            {/* Icon SVG */}
            <div className="bg-primary/10 mb-5 grid size-16 place-items-center rounded-full [&_svg]:size-8">
               <Mailsent/>
            </div>

            <p className="text-white/65 text-base font-medium">
                We have sent a confirmation email to your registered email.
                <br />
                Please click the link in the email to verify your account.
            </p>
        </div>
    )
}
