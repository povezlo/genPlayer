import { Directive, ElementRef, Input, OnInit } from '@angular/core';

@Directive({
  selector: '[testId]',
  standalone: true
})
export class TestIdDirective implements OnInit {
  @Input() public testId!: string;

  constructor(private el: ElementRef) {}

  public ngOnInit(): void {
    this.el.nativeElement.setAttribute('data-testid', this.testId);
  }
}
