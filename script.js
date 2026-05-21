const courses = [
  { code: "I2201", credits: 4 },
  { code: "I2202", credits: 4 },
  { code: "I2203", credits: 4 },
  { code: "I2204", credits: 5 },
  { code: "I2205", credits: 3 },
  { code: "M2250", credits: 3 },
  { code: "I2236", credits: 3 },
  { code: "S2250", credits: 4 }
];

const courseGrid = document.querySelector("#course-grid");
const form = document.querySelector("#marks-form");
const resultBody = document.querySelector("#result-body");
const averageValue = document.querySelector("#average-value");
const overallStatus = document.querySelector("#overall-status");
const resetButton = document.querySelector("#reset-button");

function buildInputs() {
  courseGrid.innerHTML = courses
    .map(
      (course) => `
        <div class="course-field">
          <label for="${course.code}">
            <span>${course.code}</span>
            <span class="credits">${course.credits} credits</span>
          </label>
          <input
            id="${course.code}"
            name="${course.code}"
            type="number"
            min="0"
            max="100"
            step="0.01"
            inputmode="decimal"
            placeholder="0 - 100"
            required
          >
          <span class="error" id="${course.code}-error" aria-live="polite"></span>
        </div>
      `
    )
    .join("");
}

function readMarks() {
  let hasError = false;

  const marks = courses.map((course) => {
    const input = document.querySelector(`#${course.code}`);
    const error = document.querySelector(`#${course.code}-error`);
    const mark = Number(input.value);
    const isEmpty = input.value.trim() === "";
    const isInvalid = isEmpty || Number.isNaN(mark) || mark < 0 || mark > 100;

    input.setAttribute("aria-invalid", String(isInvalid));
    error.textContent = isInvalid ? "Enter a mark from 0 to 100." : "";

    if (isInvalid) {
      hasError = true;
    }

    return { ...course, mark };
  });

  return hasError ? null : marks;
}

function getCourseStatus(mark, average) {
  if (mark >= 50) {
    return "Pass";
  }

  if (average >= 55 && mark >= 40) {
    return "Compensation";
  }

  return "Fail";
}

function renderResults(marks) {
  const totalCredits = marks.reduce((sum, course) => sum + course.credits, 0);
  const weightedTotal = marks.reduce(
    (sum, course) => sum + course.mark * course.credits,
    0
  );
  const average = weightedTotal / totalCredits;
  const coursesWithStatus = marks.map((course) => ({
    ...course,
    status: getCourseStatus(course.mark, average)
  }));
  const hasFailedCourse = coursesWithStatus.some((course) => course.status === "Fail");

  averageValue.textContent = average.toFixed(2);
  overallStatus.textContent = hasFailedCourse ? "Fail" : "Pass";
  overallStatus.className = `status-pill ${hasFailedCourse ? "fail" : "pass"}`;

  resultBody.innerHTML = coursesWithStatus
    .map(
      (course) => `
        <tr>
          <td>${course.code}</td>
          <td>${course.credits}</td>
          <td>${course.mark.toFixed(2)}</td>
          <td>
            <span class="course-status ${course.status.toLowerCase()}">
              ${course.status}
            </span>
          </td>
        </tr>
      `
    )
    .join("");
}

function showValidationMessage() {
  averageValue.textContent = "--";
  overallStatus.textContent = "Check marks";
  overallStatus.className = "status-pill not-ready";
  resultBody.innerHTML = `
    <tr>
      <td colspan="4" class="empty-state">Fix highlighted marks to calculate results.</td>
    </tr>
  `;
}

function resetResults() {
  form.reset();
  document.querySelectorAll(".error").forEach((error) => {
    error.textContent = "";
  });
  document.querySelectorAll("input").forEach((input) => {
    input.setAttribute("aria-invalid", "false");
  });
  averageValue.textContent = "--";
  overallStatus.textContent = "Waiting for marks";
  overallStatus.className = "status-pill waiting";
  resultBody.innerHTML = `
    <tr>
      <td colspan="4" class="empty-state">Results will appear after calculation.</td>
    </tr>
  `;
}

buildInputs();

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const marks = readMarks();

  if (marks) {
    renderResults(marks);
  } else {
    showValidationMessage();
  }
});

resetButton.addEventListener("click", resetResults);
