const PrivacyPolicyPage = () => {
  return (
    <div className="page-gutter-x min-h-screen bg-[#FEFFF3] py-16">
      <div className="mx-auto max-w-2xl">
        <a
          href="/"
          className="font-main mb-10 inline-block text-sm text-[#555555] transition-colors hover:text-foreground"
        >
          ← Back
        </a>

        <h1 className="font-main mb-2 text-3xl font-normal text-foreground">
          Privacy Policy
        </h1>
        <p className="font-main mb-12 text-sm text-[#555555]">
          Last updated March 06, 2026
        </p>

        <div className="font-main flex flex-col gap-10 text-base leading-relaxed text-[#555555]">
          <section>
            <p>
              This Privacy Notice for Rivet. Inc (doing business as Rivet) ("we," "us," or "our"),
              describes how and why we might access, collect, store, use, and/or share ("process")
              your personal information when you use our services ("Services"), including when you:
            </p>
            <ul className="mt-3 list-disc pl-5 flex flex-col gap-1.5">
              <li>
                Visit our website at{' '}
                <a href="https://rivet.design/" className="text-foreground underline underline-offset-2">
                  https://rivet.design/
                </a>{' '}
                or any website of ours that links to this Privacy Notice
              </li>
              <li>
                Engage with us in other related ways, including any marketing or events
              </li>
            </ul>
            <p className="mt-4">
              <strong className="text-foreground">Questions or concerns?</strong> Reading this
              Privacy Notice will help you understand your privacy rights and choices. We are
              responsible for making decisions about how your personal information is processed. If
              you do not agree with our policies and practices, please do not use our Services. If
              you still have any questions or concerns, please contact us at{' '}
              <a href="mailto:support@rivet.design" className="text-foreground underline underline-offset-2">
                support@rivet.design
              </a>
              .
            </p>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-medium text-foreground">Summary of Key Points</h2>
            <p className="italic">
              This summary provides key points from our Privacy Notice, but you can find out more
              details about any of these topics by using the table of contents below to find the
              section you are looking for.
            </p>
            <div className="flex flex-col gap-3">
              <p>
                <strong className="text-foreground">What personal information do we process?</strong>{' '}
                When you visit, use, or navigate our Services, we may process personal information
                depending on how you interact with us and the Services, the choices you make, and
                the products and features you use.
              </p>
              <p>
                <strong className="text-foreground">Do we process any sensitive personal information?</strong>{' '}
                We do not process sensitive personal information.
              </p>
              <p>
                <strong className="text-foreground">Do we collect any information from third parties?</strong>{' '}
                We do not collect any information from third parties.
              </p>
              <p>
                <strong className="text-foreground">How do we process your information?</strong>{' '}
                We process your information to provide, improve, and administer our Services,
                communicate with you, for security and fraud prevention, and to comply with law. We
                may also process your information for other purposes with your consent. We process
                your information only when we have a valid legal reason to do so.
              </p>
              <p>
                <strong className="text-foreground">In what situations and with which parties do we share personal information?</strong>{' '}
                We may share information in specific situations and with specific third parties.
              </p>
              <p>
                <strong className="text-foreground">How do we keep your information safe?</strong>{' '}
                We have adequate organizational and technical processes and procedures in place to
                protect your personal information. However, no electronic transmission over the
                internet or information storage technology can be guaranteed to be 100% secure, so
                we cannot promise or guarantee that hackers, cybercriminals, or other unauthorized
                third parties will not be able to defeat our security and improperly collect,
                access, steal, or modify your information.
              </p>
              <p>
                <strong className="text-foreground">What are your rights?</strong>{' '}
                Depending on where you are located geographically, the applicable privacy law may
                mean you have certain rights regarding your personal information.
              </p>
              <p>
                <strong className="text-foreground">How do you exercise your rights?</strong>{' '}
                The easiest way to exercise your rights is by submitting a{' '}
                <a
                  href="https://app.termly.io/dsar/0cbf86ad-d7f8-48b3-9098-c79e9b03da9b"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground underline underline-offset-2"
                >
                  data subject access request
                </a>
                , or by contacting us. We will consider and act upon any request in accordance with
                applicable data protection laws.
              </p>
            </div>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-lg font-medium text-foreground">Table of Contents</h2>
            <ol className="list-decimal pl-5 flex flex-col gap-1.5">
              {[
                'What Information Do We Collect?',
                'How Do We Process Your Information?',
                'What Legal Bases Do We Rely On To Process Your Personal Information?',
                'When And With Whom Do We Share Your Personal Information?',
                'Do We Offer Artificial Intelligence-Based Products?',
                'How Do We Handle Your Social Logins?',
                'Is Your Information Transferred Internationally?',
                'How Long Do We Keep Your Information?',
                'How Do We Keep Your Information Safe?',
                'Do We Collect Information From Minors?',
                'What Are Your Privacy Rights?',
                'Controls For Do-Not-Track Features',
                'Do United States Residents Have Specific Privacy Rights?',
                'Do We Make Updates To This Notice?',
                'How Can You Contact Us About This Notice?',
                'How Can You Review, Update, Or Delete The Data We Collect From You?',
              ].map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ol>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-medium text-foreground">1. What Information Do We Collect?</h2>
            <h3 className="font-medium text-foreground">Personal information you disclose to us</h3>
            <p className="italic">In Short: We collect personal information that you provide to us.</p>
            <p>
              We collect personal information that you voluntarily provide to us when you register
              on the Services, express an interest in obtaining information about us or our products
              and Services, when you participate in activities on the Services, or otherwise when
              you contact us.
            </p>
            <p>
              <strong className="text-foreground">Personal Information Provided by You.</strong>{' '}
              The personal information that we collect depends on the context of your interactions
              with us and the Services, the choices you make, and the products and features you use.
              The personal information we collect may include the following:
            </p>
            <ul className="list-disc pl-5 flex flex-col gap-1">
              <li>names</li>
              <li>email addresses</li>
            </ul>
            <p>
              <strong className="text-foreground">Sensitive Information.</strong> We do not process
              sensitive information.
            </p>
            <p>
              <strong className="text-foreground">Payment Data.</strong> We may collect data
              necessary to process your payment if you choose to make purchases, such as your
              payment instrument number, and the security code associated with your payment
              instrument. All payment data is handled and stored by Stripe. You may find their
              privacy notice link(s) here:{' '}
              <a
                href="https://stripe.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline underline-offset-2"
              >
                https://stripe.com/privacy
              </a>
              .
            </p>
            <p>
              <strong className="text-foreground">Social Media Login Data.</strong> We may provide
              you with the option to register with us using your existing social media account
              details, like your Facebook, X, or other social media account. If you choose to
              register in this way, we will collect certain profile information about you from the
              social media provider, as described in the section called "HOW DO WE HANDLE YOUR
              SOCIAL LOGINS?" below.
            </p>
            <p>
              All personal information that you provide to us must be true, complete, and accurate,
              and you must notify us of any changes to such personal information.
            </p>

            <h3 className="font-medium text-foreground">Information automatically collected</h3>
            <p className="italic">
              In Short: Some information — such as your Internet Protocol (IP) address and/or
              browser and device characteristics — is collected automatically when you visit our
              Services.
            </p>
            <p>
              We automatically collect certain information when you visit, use, or navigate the
              Services. This information does not reveal your specific identity (like your name or
              contact information) but may include device and usage information, such as your IP
              address, browser and device characteristics, operating system, language preferences,
              referring URLs, device name, country, location, information about how and when you
              use our Services, and other technical information. This information is primarily
              needed to maintain the security and operation of our Services, and for our internal
              analytics and reporting purposes.
            </p>
            <p>The information we collect includes:</p>
            <ul className="list-disc pl-5 flex flex-col gap-3">
              <li>
                <strong className="text-foreground">Log and Usage Data.</strong> Log and usage data
                is service-related, diagnostic, usage, and performance information our servers
                automatically collect when you access or use our Services and which we record in
                log files. Depending on how you interact with us, this log data may include your IP
                address, device information, browser type, and settings and information about your
                activity in the Services (such as the date/time stamps associated with your usage,
                pages and files viewed, searches, and other actions you take such as which features
                you use), device event information (such as system activity, error reports
                (sometimes called "crash dumps"), and hardware settings).
              </li>
              <li>
                <strong className="text-foreground">Device Data.</strong> We collect device data
                such as information about your computer, phone, tablet, or other device you use to
                access the Services. Depending on the device used, this device data may include
                information such as your IP address (or proxy server), device and application
                identification numbers, location, browser type, hardware model, Internet service
                provider and/or mobile carrier, operating system, and system configuration
                information.
              </li>
              <li>
                <strong className="text-foreground">Location Data.</strong> We collect location
                data such as information about your device's location, which can be either precise
                or imprecise. How much information we collect depends on the type and settings of
                the device you use to access the Services. For example, we may use GPS and other
                technologies to collect geolocation data that tells us your current location (based
                on your IP address). You can opt out of allowing us to collect this information
                either by refusing access to the information or by disabling your Location setting
                on your device. However, if you choose to opt out, you may not be able to use
                certain aspects of the Services.
              </li>
            </ul>

            <h3 className="font-medium text-foreground">Google API</h3>
            <p>
              Our use of information received from Google APIs will adhere to{' '}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline underline-offset-2"
              >
                Google API Services User Data Policy
              </a>
              , including the{' '}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy#limited-use"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline underline-offset-2"
              >
                Limited Use requirements
              </a>
              .
            </p>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-medium text-foreground">2. How Do We Process Your Information?</h2>
            <p className="italic">
              In Short: We process your information to provide, improve, and administer our
              Services, communicate with you, for security and fraud prevention, and to comply with
              law. We process the personal information for the following purposes listed below. We
              may also process your information for other purposes only with your prior explicit
              consent.
            </p>
            <p>
              <strong className="text-foreground">
                We process your personal information for a variety of reasons, depending on how you
                interact with our Services, including:
              </strong>
            </p>
            <ul className="list-disc pl-5 flex flex-col gap-3">
              <li>
                <strong className="text-foreground">To facilitate account creation and authentication and otherwise manage user accounts.</strong>{' '}
                We may process your information so you can create and log in to your account, as
                well as keep your account in working order.
              </li>
              <li>
                <strong className="text-foreground">To deliver and facilitate delivery of services to the user.</strong>{' '}
                We may process your information to provide you with the requested service.
              </li>
              <li>
                <strong className="text-foreground">To respond to user inquiries/offer support to users.</strong>{' '}
                We may process your information to respond to your inquiries and solve any potential
                issues you might have with the requested service.
              </li>
              <li>
                <strong className="text-foreground">To send administrative information to you.</strong>{' '}
                We may process your information to send you details about our products and services,
                changes to our terms and policies, and other similar information.
              </li>
              <li>
                <strong className="text-foreground">To request feedback.</strong>{' '}
                We may process your information when necessary to request feedback and to contact
                you about your use of our Services.
              </li>
              <li>
                <strong className="text-foreground">To protect our Services.</strong>{' '}
                We may process your information as part of our efforts to keep our Services safe and
                secure, including fraud monitoring and prevention.
              </li>
              <li>
                <strong className="text-foreground">To identify usage trends.</strong>{' '}
                We may process information about how you use our Services to better understand how
                they are being used so we can improve them.
              </li>
              <li>
                <strong className="text-foreground">To save or protect an individual's vital interest.</strong>{' '}
                We may process your information when necessary to save or protect an individual's
                vital interest, such as to prevent harm.
              </li>
            </ul>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-medium text-foreground">
              3. What Legal Bases Do We Rely On To Process Your Personal Information?
            </h2>
            <p className="italic">
              In Short: We only process your personal information when we believe it is necessary
              and we have a valid legal reason (i.e., legal basis) to do so under applicable law,
              like with your consent, to comply with laws, to provide you with services to enter
              into or fulfill our contractual obligations, to protect your rights, or to fulfill our
              legitimate business interests.
            </p>
            <h3 className="font-medium text-foreground">If you are located in the EU or UK, this section applies to you.</h3>
            <p>
              The General Data Protection Regulation (GDPR) and UK GDPR require us to explain the
              valid legal bases we rely on in order to process your personal information. As such,
              we may rely on the following legal bases to process your personal information:
            </p>
            <ul className="list-disc pl-5 flex flex-col gap-3">
              <li>
                <strong className="text-foreground">Consent.</strong> We may process your
                information if you have given us permission (i.e., consent) to use your personal
                information for a specific purpose. You can withdraw your consent at any time.
              </li>
              <li>
                <strong className="text-foreground">Performance of a Contract.</strong> We may
                process your personal information when we believe it is necessary to fulfill our
                contractual obligations to you, including providing our Services or at your request
                prior to entering into a contract with you.
              </li>
              <li>
                <strong className="text-foreground">Legitimate Interests.</strong> We may process
                your information when we believe it is reasonably necessary to achieve our
                legitimate business interests and those interests do not outweigh your interests and
                fundamental rights and freedoms. For example, we may process your personal
                information for some of the purposes described in order to:
                <ul className="mt-2 list-disc pl-5 flex flex-col gap-1">
                  <li>Analyze how our Services are used so we can improve them to engage and retain users</li>
                  <li>Diagnose problems and/or prevent fraudulent activities</li>
                  <li>Understand how our users use our products and services so we can improve user experience</li>
                </ul>
              </li>
              <li>
                <strong className="text-foreground">Legal Obligations.</strong> We may process your
                information where we believe it is necessary for compliance with our legal
                obligations, such as to cooperate with a law enforcement body or regulatory agency,
                exercise or defend our legal rights, or disclose your information as evidence in
                litigation in which we are involved.
              </li>
              <li>
                <strong className="text-foreground">Vital Interests.</strong> We may process your
                information where we believe it is necessary to protect your vital interests or the
                vital interests of a third party, such as situations involving potential threats to
                the safety of any person.
              </li>
            </ul>

            <h3 className="font-medium text-foreground">If you are located in Canada, this section applies to you.</h3>
            <p>
              We may process your information if you have given us specific permission (i.e.,
              express consent) to use your personal information for a specific purpose, or in
              situations where your permission can be inferred (i.e., implied consent). You can
              withdraw your consent at any time.
            </p>
            <p>
              In some exceptional cases, we may be legally permitted under applicable law to process
              your information without your consent, including, for example:
            </p>
            <ul className="list-disc pl-5 flex flex-col gap-1.5">
              <li>If collection is clearly in the interests of an individual and consent cannot be obtained in a timely way</li>
              <li>For investigations and fraud detection and prevention</li>
              <li>For business transactions provided certain conditions are met</li>
              <li>If it is contained in a witness statement and the collection is necessary to assess, process, or settle an insurance claim</li>
              <li>For identifying injured, ill, or deceased persons and communicating with next of kin</li>
              <li>If we have reasonable grounds to believe an individual has been, is, or may be victim of financial abuse</li>
              <li>If it is reasonable to expect collection and use with consent would compromise the availability or the accuracy of the information and the collection is reasonable for purposes related to investigating a breach of an agreement or a contravention of the laws of Canada or a province</li>
              <li>If disclosure is required to comply with a subpoena, warrant, court order, or rules of the court relating to the production of records</li>
              <li>If it was produced by an individual in the course of their employment, business, or profession and the collection is consistent with the purposes for which the information was produced</li>
              <li>If the collection is solely for journalistic, artistic, or literary purposes</li>
              <li>If the information is publicly available and is specified by the regulations</li>
              <li>We may disclose de-identified information for approved research or statistics projects, subject to ethics oversight and confidentiality commitments</li>
            </ul>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-medium text-foreground">
              4. When And With Whom Do We Share Your Personal Information?
            </h2>
            <p className="italic">
              In Short: We may share information in specific situations described in this section
              and/or with the following third parties.
            </p>
            <p>We may need to share your personal information in the following situations:</p>
            <ul className="list-disc pl-5">
              <li>
                <strong className="text-foreground">Business Transfers.</strong> We may share or
                transfer your information in connection with, or during negotiations of, any merger,
                sale of company assets, financing, or acquisition of all or a portion of our
                business to another company.
              </li>
            </ul>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-medium text-foreground">
              5. Do We Offer Artificial Intelligence-Based Products?
            </h2>
            <p className="italic">
              In Short: We offer products, features, or tools powered by artificial intelligence,
              machine learning, or similar technologies.
            </p>
            <p>
              As part of our Services, we offer products, features, or tools powered by artificial
              intelligence, machine learning, or similar technologies (collectively, "AI Products").
              These tools are designed to enhance your experience and provide you with innovative
              solutions. The terms in this Privacy Notice govern your use of the AI Products within
              our Services.
            </p>
            <p>
              <strong className="text-foreground">Use of AI Technologies</strong>
            </p>
            <p>
              We provide the AI Products through third-party service providers ("AI Service
              Providers"), including Anthropic and OpenAI. As outlined in this Privacy Notice, your
              input, output, and personal information will be shared with and processed by these AI
              Service Providers to enable your use of our AI Products. You must not use the AI
              Products in any way that violates the terms or policies of any AI Service Provider.
            </p>
            <p>
              <strong className="text-foreground">Our AI Products</strong>
            </p>
            <p>Our AI Products are designed for the following functions:</p>
            <ul className="list-disc pl-5">
              <li>AI applications</li>
            </ul>
            <p>
              <strong className="text-foreground">How We Process Your Data Using AI</strong>
            </p>
            <p>
              All personal information processed using our AI Products is handled in line with our
              Privacy Notice and our agreement with third parties. This ensures high security and
              safeguards your personal information throughout the process, giving you peace of mind
              about your data's safety.
            </p>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-medium text-foreground">
              6. How Do We Handle Your Social Logins?
            </h2>
            <p className="italic">
              In Short: If you choose to register or log in to our Services using a social media
              account, we may have access to certain information about you.
            </p>
            <p>
              Our Services offer you the ability to register and log in using your third-party
              social media account details (like your Facebook or X logins). Where you choose to do
              this, we will receive certain profile information about you from your social media
              provider. The profile information we receive may vary depending on the social media
              provider concerned, but will often include your name, email address, friends list, and
              profile picture, as well as other information you choose to make public on such a
              social media platform.
            </p>
            <p>
              We will use the information we receive only for the purposes that are described in
              this Privacy Notice or that are otherwise made clear to you on the relevant Services.
              Please note that we do not control, and are not responsible for, other uses of your
              personal information by your third-party social media provider. We recommend that you
              review their privacy notice to understand how they collect, use, and share your
              personal information, and how you can set your privacy preferences on their sites and
              apps.
            </p>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-medium text-foreground">
              7. Is Your Information Transferred Internationally?
            </h2>
            <p className="italic">
              In Short: We may transfer, store, and process your information in countries other than
              your own.
            </p>
            <p>
              Our servers are located in the United States. Regardless of your location, please be
              aware that your information may be transferred to, stored by, and processed by us in
              our facilities and in the facilities of the third parties with whom we may share your
              personal information (see "WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL
              INFORMATION?" above), including facilities in the United States and other countries.
            </p>
            <p>
              If you are a resident in the European Economic Area (EEA), United Kingdom (UK), or
              Switzerland, then these countries may not necessarily have data protection laws or
              other similar laws as comprehensive as those in your country. However, we will take
              all necessary measures to protect your personal information in accordance with this
              Privacy Notice and applicable law.
            </p>
            <p>
              <strong className="text-foreground">European Commission's Standard Contractual Clauses:</strong>
            </p>
            <p>
              We have implemented measures to protect your personal information, including by using
              the European Commission's Standard Contractual Clauses for transfers of personal
              information between our group companies and between us and our third-party providers.
              These clauses require all recipients to protect all personal information that they
              process originating from the EEA or UK in accordance with European data protection
              laws and regulations. Our Standard Contractual Clauses can be provided upon request.
              We have implemented similar appropriate safeguards with our third-party service
              providers and partners and further details can be provided upon request.
            </p>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-medium text-foreground">
              8. How Long Do We Keep Your Information?
            </h2>
            <p className="italic">
              In Short: We keep your information for as long as necessary to fulfill the purposes
              outlined in this Privacy Notice unless otherwise required by law.
            </p>
            <p>
              We will only keep your personal information for as long as it is necessary for the
              purposes set out in this Privacy Notice, unless a longer retention period is required
              or permitted by law (such as tax, accounting, or other legal requirements). No purpose
              in this notice will require us keeping your personal information for longer than the
              period of time in which users have an account with us.
            </p>
            <p>
              When we have no ongoing legitimate business need to process your personal information,
              we will either delete or anonymize such information, or, if this is not possible (for
              example, because your personal information has been stored in backup archives), then
              we will securely store your personal information and isolate it from any further
              processing until deletion is possible.
            </p>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-medium text-foreground">
              9. How Do We Keep Your Information Safe?
            </h2>
            <p className="italic">
              In Short: We aim to protect your personal information through a system of
              organizational and technical security measures.
            </p>
            <p>
              We have implemented appropriate and reasonable technical and organizational security
              measures designed to protect the security of any personal information we process.
              However, despite our safeguards and efforts to secure your information, no electronic
              transmission over the Internet or information storage technology can be guaranteed to
              be 100% secure, so we cannot promise or guarantee that hackers, cybercriminals, or
              other unauthorized third parties will not be able to defeat our security and
              improperly collect, access, steal, or modify your information. Although we will do our
              best to protect your personal information, transmission of personal information to and
              from our Services is at your own risk. You should only access the Services within a
              secure environment.
            </p>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-medium text-foreground">
              10. Do We Collect Information From Minors?
            </h2>
            <p className="italic">
              In Short: We do not knowingly collect data from or market to children under 18 years
              of age or the equivalent age as specified by law in your jurisdiction.
            </p>
            <p>
              We do not knowingly collect, solicit data from, or market to children under 18 years
              of age or the equivalent age as specified by law in your jurisdiction, nor do we
              knowingly sell such personal information. By using the Services, you represent that
              you are at least 18 or the equivalent age as specified by law in your jurisdiction or
              that you are the parent or guardian of such a minor and consent to such minor
              dependent's use of the Services. If we learn that personal information from users less
              than 18 years of age or the equivalent age as specified by law in your jurisdiction
              has been collected, we will deactivate the account and take reasonable measures to
              promptly delete such data from our records. If you become aware of any data we may
              have collected from children under age 18 or the equivalent age as specified by law in
              your jurisdiction, please contact us at{' '}
              <a href="mailto:support@rivet.design" className="text-foreground underline underline-offset-2">
                support@rivet.design
              </a>
              .
            </p>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-medium text-foreground">11. What Are Your Privacy Rights?</h2>
            <p className="italic">
              In Short: Depending on your state of residence in the US or in some regions, such as
              the European Economic Area (EEA), United Kingdom (UK), Switzerland, and Canada, you
              have rights that allow you greater access to and control over your personal
              information. You may review, change, or terminate your account at any time, depending
              on your country, province, or state of residence.
            </p>
            <p>
              In some regions (like the EEA, UK, Switzerland, and Canada), you have certain rights
              under applicable data protection laws. These may include the right (i) to request
              access and obtain a copy of your personal information, (ii) to request rectification
              or erasure; (iii) to restrict the processing of your personal information; (iv) if
              applicable, to data portability; and (v) not to be subject to automated
              decision-making. If a decision that produces legal or similarly significant effects is
              made solely by automated means, we will inform you, explain the main factors, and
              offer a simple way to request human review. In certain circumstances, you may also
              have the right to object to the processing of your personal information. You can make
              such a request by contacting us by using the contact details provided in the section
              "HOW CAN YOU CONTACT US ABOUT THIS NOTICE?" below.
            </p>
            <p>
              We will consider and act upon any request in accordance with applicable data
              protection laws.
            </p>
            <p>
              If you are located in the EEA or UK and you believe we are unlawfully processing your
              personal information, you also have the right to complain to your{' '}
              <a
                href="https://ec.europa.eu/justice/data-protection/bodies/authorities/index_en.htm"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline underline-offset-2"
              >
                Member State data protection authority
              </a>{' '}
              or{' '}
              <a
                href="https://ico.org.uk/make-a-complaint/data-protection-complaints/data-protection-complaints/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline underline-offset-2"
              >
                UK data protection authority
              </a>
              .
            </p>
            <p>
              If you are located in Switzerland, you may contact the{' '}
              <a
                href="https://www.edoeb.admin.ch/edoeb/en/home.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline underline-offset-2"
              >
                Federal Data Protection and Information Commissioner
              </a>
              .
            </p>
            <p>
              <strong className="text-foreground">Withdrawing your consent:</strong> If we are
              relying on your consent to process your personal information, which may be express
              and/or implied consent depending on the applicable law, you have the right to withdraw
              your consent at any time. You can withdraw your consent at any time by contacting us
              by using the contact details provided in the section "HOW CAN YOU CONTACT US ABOUT
              THIS NOTICE?" below.
            </p>
            <p>
              However, please note that this will not affect the lawfulness of the processing before
              its withdrawal nor, when applicable law allows, will it affect the processing of your
              personal information conducted in reliance on lawful processing grounds other than
              consent.
            </p>
            <p>
              <strong className="text-foreground">Opting out of marketing and promotional communications:</strong>{' '}
              You can unsubscribe from our marketing and promotional communications at any time by
              clicking on the unsubscribe link in the emails that we send, or by contacting us using
              the details provided in the section "HOW CAN YOU CONTACT US ABOUT THIS NOTICE?" below.
              You will then be removed from the marketing lists. However, we may still communicate
              with you — for example, to send you service-related messages that are necessary for
              the administration and use of your account, to respond to service requests, or for
              other non-marketing purposes.
            </p>
            <h3 className="font-medium text-foreground">Account Information</h3>
            <p>
              If you would at any time like to review or change the information in your account or
              terminate your account, you can contact us using the contact information provided.
            </p>
            <p>
              Upon your request to terminate your account, we will deactivate or delete your account
              and information from our active databases. However, we may retain some information in
              our files to prevent fraud, troubleshoot problems, assist with any investigations,
              enforce our legal terms and/or comply with applicable legal requirements.
            </p>
            <p>
              If you have questions or comments about your privacy rights, you may email us at{' '}
              <a href="mailto:support@rivet.design" className="text-foreground underline underline-offset-2">
                support@rivet.design
              </a>
              .
            </p>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-medium text-foreground">
              12. Controls For Do-Not-Track Features
            </h2>
            <p>
              Most web browsers and some mobile operating systems and mobile applications include a
              Do-Not-Track ("DNT") feature or setting you can activate to signal your privacy
              preference not to have data about your online browsing activities monitored and
              collected. At this stage, no uniform technology standard for recognizing and
              implementing DNT signals has been finalized. As such, we do not currently respond to
              DNT browser signals or any other mechanism that automatically communicates your choice
              not to be tracked online. If a standard for online tracking is adopted that we must
              follow in the future, we will inform you about that practice in a revised version of
              this Privacy Notice.
            </p>
            <p>
              California law requires us to let you know how we respond to web browser DNT signals.
              Because there currently is not an industry or legal standard for recognizing or
              honoring DNT signals, we do not respond to them at this time.
            </p>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-medium text-foreground">
              13. Do United States Residents Have Specific Privacy Rights?
            </h2>
            <p className="italic">
              In Short: If you are a resident of California, Colorado, Connecticut, Delaware,
              Florida, Indiana, Iowa, Kentucky, Maryland, Minnesota, Montana, Nebraska, New
              Hampshire, New Jersey, Oregon, Rhode Island, Tennessee, Texas, Utah, or Virginia, you
              may have the right to request access to and receive details about the personal
              information we maintain about you and how we have processed it, correct inaccuracies,
              get a copy of, or delete your personal information. You may also have the right to
              withdraw your consent to our processing of your personal information. These rights may
              be limited in some circumstances by applicable law. More information is provided
              below.
            </p>

            <h3 className="font-medium text-foreground">Categories of Personal Information We Collect</h3>
            <p>
              The table below shows the categories of personal information we have collected in the
              past twelve (12) months.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-foreground/20">
                    <th className="py-2 pr-4 text-left font-medium text-foreground">Category</th>
                    <th className="py-2 pr-4 text-left font-medium text-foreground">Examples</th>
                    <th className="py-2 text-left font-medium text-foreground">Collected</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-foreground/10">
                  {[
                    ['A. Identifiers', 'Contact details, such as real name, alias, postal address, telephone or mobile contact number, unique personal identifier, online identifier, Internet Protocol address, email address, and account name', 'YES'],
                    ['B. Personal information as defined in the California Customer Records statute', 'Name, contact information, education, employment, employment history, and financial information', 'YES'],
                    ['C. Protected classification characteristics under state or federal law', 'Gender, age, date of birth, race and ethnicity, national origin, marital status, and other demographic data', 'NO'],
                    ['D. Commercial information', 'Transaction information, purchase history, financial details, and payment information', 'NO'],
                    ['E. Biometric information', 'Fingerprints and voiceprints', 'NO'],
                    ['F. Internet or other similar network activity', 'Browsing history, search history, online behavior, interest data, and interactions with our and other websites, applications, systems, and advertisements', 'NO'],
                    ['G. Geolocation data', 'Device location', 'YES'],
                    ['H. Audio, electronic, sensory, or similar information', 'Images and audio, video or call recordings created in connection with our business activities', 'NO'],
                    ['I. Professional or employment-related information', 'Business contact details in order to provide you our Services at a business level or job title, work history, and professional qualifications if you apply for a job with us', 'NO'],
                    ['J. Education Information', 'Student records and directory information', 'NO'],
                    ['K. Inferences drawn from collected personal information', "Inferences drawn from any of the collected personal information listed above to create a profile or summary about, for example, an individual's preferences and characteristics", 'NO'],
                    ['L. Sensitive personal Information', '', 'NO'],
                  ].map(([cat, ex, col]) => (
                    <tr key={cat}>
                      <td className="py-2 pr-4 align-top">{cat}</td>
                      <td className="py-2 pr-4 align-top">{ex}</td>
                      <td className="py-2 align-top font-medium text-foreground">{col}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p>
              We may also collect other personal information outside of these categories through
              instances where you interact with us in person, online, or by phone or mail in the
              context of:
            </p>
            <ul className="list-disc pl-5 flex flex-col gap-1">
              <li>Receiving help through our customer support channels</li>
              <li>Participation in customer surveys or contests</li>
              <li>Facilitation in the delivery of our Services and to respond to your inquiries</li>
            </ul>
            <p>
              We will use and retain the collected personal information as needed to provide the
              Services or for:
            </p>
            <ul className="list-disc pl-5 flex flex-col gap-1">
              <li>Category A - As long as the user has an account with us</li>
              <li>Category B - As long as the user has an account with us</li>
              <li>Category G - As long as the user has an account with us</li>
            </ul>

            <h3 className="font-medium text-foreground">Your Rights</h3>
            <p>
              You have rights under certain US state data protection laws. However, these rights are
              not absolute, and in certain cases, we may decline your request as permitted by law.
              These rights include:
            </p>
            <ul className="list-disc pl-5 flex flex-col gap-1.5">
              <li><strong className="text-foreground">Right to know</strong> whether or not we are processing your personal data</li>
              <li><strong className="text-foreground">Right to access</strong> your personal data</li>
              <li><strong className="text-foreground">Right to correct</strong> inaccuracies in your personal data</li>
              <li><strong className="text-foreground">Right to request</strong> the deletion of your personal data</li>
              <li><strong className="text-foreground">Right to obtain a copy</strong> of the personal data you previously shared with us</li>
              <li><strong className="text-foreground">Right to non-discrimination</strong> for exercising your rights</li>
              <li><strong className="text-foreground">Right to opt out</strong> of the processing of your personal data if it is used for targeted advertising (or sharing as defined under California's privacy law), the sale of personal data, or profiling in furtherance of decisions that produce legal or similarly significant effects ("profiling")</li>
            </ul>
            <p>Depending upon the state where you live, you may also have the following rights:</p>
            <ul className="list-disc pl-5 flex flex-col gap-1.5">
              <li>Right to access the categories of personal data being processed (as permitted by applicable law, including the privacy law in Minnesota)</li>
              <li>Right to obtain a list of the categories of third parties to which we have disclosed personal data (as permitted by applicable law, including the privacy law in California, Delaware, and Maryland)</li>
              <li>Right to obtain a list of specific third parties to which we have disclosed personal data (as permitted by applicable law, including the privacy law in Minnesota and Oregon)</li>
              <li>Right to obtain a list of third parties to which we have sold personal data (as permitted by applicable law, including the privacy law in Connecticut)</li>
              <li>Right to review, understand, question, and depending on where you live, correct how personal data has been profiled (as permitted by applicable law, including the privacy law in Connecticut and Minnesota)</li>
              <li>Right to limit use and disclosure of sensitive personal data (as permitted by applicable law, including the privacy law in California)</li>
              <li>Right to opt out of the collection of sensitive data and personal data collected through the operation of a voice or facial recognition feature (as permitted by applicable law, including the privacy law in Florida)</li>
            </ul>

            <h3 className="font-medium text-foreground">How to Exercise Your Rights</h3>
            <p>
              To exercise these rights, you can contact us by submitting a{' '}
              <a
                href="https://app.termly.io/dsar/0cbf86ad-d7f8-48b3-9098-c79e9b03da9b"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline underline-offset-2"
              >
                data subject access request
              </a>
              , by emailing us at{' '}
              <a href="mailto:support@rivet.design" className="text-foreground underline underline-offset-2">
                support@rivet.design
              </a>
              , by calling toll-free at (707) 861-0747, or by referring to the contact details at
              the bottom of this document.
            </p>
            <p>
              Under certain US state data protection laws, you can designate an authorized agent to
              make a request on your behalf. We may deny a request from an authorized agent that
              does not submit proof that they have been validly authorized to act on your behalf in
              accordance with applicable laws.
            </p>

            <h3 className="font-medium text-foreground">Request Verification</h3>
            <p>
              Upon receiving your request, we will need to verify your identity to determine you are
              the same person about whom we have the information in our system. We will only use
              personal information provided in your request to verify your identity or authority to
              make the request. However, if we cannot verify your identity from the information
              already maintained by us, we may request that you provide additional information for
              the purposes of verifying your identity and for security or fraud-prevention purposes.
            </p>
            <p>
              If you submit the request through an authorized agent, we may need to collect
              additional information to verify your identity before processing your request and the
              agent will need to provide a written and signed permission from you to submit such
              request on your behalf.
            </p>

            <h3 className="font-medium text-foreground">Appeals</h3>
            <p>
              Under certain US state data protection laws, if we decline to take action regarding
              your request, you may appeal our decision by emailing us at{' '}
              <a href="mailto:support@rivet.design" className="text-foreground underline underline-offset-2">
                support@rivet.design
              </a>
              . We will inform you in writing of any action taken or not taken in response to the
              appeal, including a written explanation of the reasons for the decisions. If your
              appeal is denied, you may submit a complaint to your state attorney general.
            </p>

            <h3 className="font-medium text-foreground">California "Shine The Light" Law</h3>
            <p>
              California Civil Code Section 1798.83, also known as the "Shine The Light" law,
              permits our users who are California residents to request and obtain from us, once a
              year and free of charge, information about categories of personal information (if any)
              we disclosed to third parties for direct marketing purposes and the names and addresses
              of all third parties with which we shared personal information in the immediately
              preceding calendar year. If you are a California resident and would like to make such
              a request, please submit your request in writing to us by using the contact details
              provided in the section "HOW CAN YOU CONTACT US ABOUT THIS NOTICE?"
            </p>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-medium text-foreground">
              14. Do We Make Updates To This Notice?
            </h2>
            <p className="italic">
              In Short: Yes, we will update this notice as necessary to stay compliant with relevant
              laws.
            </p>
            <p>
              We may update this Privacy Notice from time to time. The updated version will be
              indicated by an updated "Revised" date at the top of this Privacy Notice. If we make
              material changes to this Privacy Notice, we may notify you either by prominently
              posting a notice of such changes or by directly sending you a notification. We
              encourage you to review this Privacy Notice frequently to be informed of how we are
              protecting your information.
            </p>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-medium text-foreground">
              15. How Can You Contact Us About This Notice?
            </h2>
            <p>
              If you have questions or comments about this notice, you may email us at{' '}
              <a href="mailto:support@rivet.design" className="text-foreground underline underline-offset-2">
                support@rivet.design
              </a>{' '}
              or contact us by post at:
            </p>
            <p className="text-foreground">Rivet. Inc</p>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-medium text-foreground">
              16. How Can You Review, Update, Or Delete The Data We Collect From You?
            </h2>
            <p>
              Based on the applicable laws of your country or state of residence in the US, you may
              have the right to request access to the personal information we collect from you,
              details about how we have processed it, correct inaccuracies, or delete your personal
              information. You may also have the right to withdraw your consent to our processing of
              your personal information. These rights may be limited in some circumstances by
              applicable law. To request to review, update, or delete your personal information,
              please fill out and submit a{' '}
              <a
                href="https://app.termly.io/dsar/0cbf86ad-d7f8-48b3-9098-c79e9b03da9b"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline underline-offset-2"
              >
                data subject access request
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
